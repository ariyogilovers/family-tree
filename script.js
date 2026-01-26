// Supabase Configuration
const SUPABASE_URL = 'https://jgsnghsreiubzoajikbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc25naHNyZWl1YnpvYWppa2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg0NzUsImV4cCI6MjA4NDYyNDQ3NX0.vR7XDTngpsPila8O7gx6ZfaaxYX_h7Mu9aLxt7b8gJ0';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let familyData = [];
let currentMemberId = null;

// DOM Elements
const familyTree = document.getElementById('familyTree');
const addMemberBtn = document.getElementById('addMemberBtn');
const infoModal = document.getElementById('infoModal');
const formModal = document.getElementById('formModal');
const deleteModal = document.getElementById('deleteModal');
const memberForm = document.getElementById('memberForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFamilyData();
    setupEventListeners();
    startLiveClock();
    setupZoomControls();
});

// Live Clock Function
function startLiveClock() {
    const clockElement = document.getElementById('liveClock');

    function updateClock() {
        const now = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const dayName = days[now.getDay()];
        const date = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        clockElement.innerHTML = `${dayName}, ${date} ${month} ${year} | <span class="time">${hours}:${minutes}:${seconds}</span>`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Zoom Control
let currentZoom = 100;
const minZoom = 30;
const maxZoom = 150;
const zoomStep = 10;

function setupZoomControls() {
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomReset = document.getElementById('zoomReset');
    const zoomLevel = document.getElementById('zoomLevel');
    const tree = document.getElementById('familyTree');

    function updateZoom() {
        tree.style.transform = `scale(${currentZoom / 100})`;
        tree.style.transformOrigin = 'top center';
        zoomLevel.textContent = `${currentZoom}%`;
    }

    zoomIn.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            updateZoom();
        }
    });

    zoomOut.addEventListener('click', () => {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            updateZoom();
        }
    });

    zoomReset.addEventListener('click', () => {
        currentZoom = 100;
        updateZoom();
    });

    // Touch gesture for pinch zoom on mobile
    let initialDistance = 0;
    tree.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        }
    });

    tree.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const currentDistance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const diff = currentDistance - initialDistance;
            if (Math.abs(diff) > 20) {
                if (diff > 0 && currentZoom < maxZoom) {
                    currentZoom += 5;
                } else if (diff < 0 && currentZoom > minZoom) {
                    currentZoom -= 5;
                }
                updateZoom();
                initialDistance = currentDistance;
            }
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    addMemberBtn.addEventListener('click', () => openFormModal());

    document.querySelectorAll('.close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });

    memberForm.addEventListener('submit', handleFormSubmit);

    document.getElementById('editFromDetail').addEventListener('click', () => {
        closeModal('infoModal');
        openFormModal(currentMemberId);
    });

    document.getElementById('deleteFromDetail').addEventListener('click', () => {
        closeModal('infoModal');
        openDeleteModal(currentMemberId);
    });

    document.getElementById('confirmDelete').addEventListener('click', handleDelete);

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Image Popup Handlers
    const imageModal = document.getElementById('imageModal');
    const fullImage = document.getElementById('fullImage');
    const closeImageModal = document.getElementById('closeImageModal');
    const modalPhoto = document.getElementById('modalPhoto');

    if (modalPhoto) {
        modalPhoto.parentElement.addEventListener('click', () => {
            imageModal.style.display = 'flex';
            fullImage.src = modalPhoto.src;
        });
    }

    if (closeImageModal) {
        closeImageModal.addEventListener('click', () => {
            imageModal.style.display = 'none';
        });
    }

    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });
}

// Supabase API Functions
async function loadFamilyData() {
    try {
        const { data, error } = await supabaseClient
            .from('family')
            .select('*')
            .order('id');

        if (error) throw error;

        familyData = data || [];
        renderTree();
        populateSelects();
    } catch (error) {
        console.error('Failed to load data:', error);
        familyTree.innerHTML = `<p style="color: #ff6b6b; text-align: center;">Gagal memuat data: ${error.message}</p>`;
    }
}

async function saveMember(memberData) {
    const isEdit = memberData.id;

    try {
        if (isEdit) {
            const { data, error } = await supabaseClient
                .from('family')
                .update(memberData)
                .eq('id', memberData.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            delete memberData.id;
            const { data, error } = await supabaseClient
                .from('family')
                .insert(memberData)
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    } catch (error) {
        console.error('Save error:', error);
        throw error;
    }
}

async function deleteMember(id) {
    const { error } = await supabaseClient
        .from('family')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Render Functions
// Set to track rendered member IDs to prevent duplicates
let renderedMembers = new Set();

function renderTree() {
    // Reset tracking for each render
    renderedMembers = new Set();

    if (familyData.length === 0) {
        familyTree.innerHTML = '<p style="color: #aaa; text-align: center;">Belum ada data. Klik "+ Tambah Anggota" untuk memulai.</p>';
        return;
    }

    const generations = {};
    familyData.forEach(member => {
        const gen = member.generation || 1;
        if (!generations[gen]) generations[gen] = [];
        generations[gen].push(member);
    });

    let html = '<ul>';

    const roots = generations[1] || [];
    const mainRoot = roots.find(m => !m.spouse_id || m.id < m.spouse_id) || roots[0];

    if (mainRoot) {
        html += renderMemberWithChildren(mainRoot);
    }

    html += '</ul>';
    familyTree.innerHTML = html;

    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-actions')) {
                openInfoModal(parseInt(card.dataset.id));
            }
        });
    });
}

function renderMemberWithChildren(member) {
    // Skip if this member has already been rendered
    if (renderedMembers.has(member.id)) {
        return '';
    }
    renderedMembers.add(member.id);

    const spouse = member.spouse_id ? familyData.find(m => m.id === member.spouse_id) : null;
    // Get children and sort by birth_order (1st child, 2nd child, etc.) from left to right
    const children = familyData
        .filter(m => m.parent_id === member.id)
        .sort((a, b) => (a.birth_order || a.id) - (b.birth_order || b.id));

    const hasChildren = children.length > 0;

    let html = '<li>';

    // If has spouse, wrap both in couple-wrapper with heart connector
    if (spouse && !renderedMembers.has(spouse.id) && !familyData.some(m => m.parent_id === spouse.id)) {
        renderedMembers.add(spouse.id);
        html += '<div class="couple-wrapper">';
        html += renderCard(member, false, hasChildren);
        html += '<div class="heart-connector"><span>♥</span></div>';
        html += renderCard(spouse, true, false);
        html += '</div>';
    } else {
        html += renderCard(member, false, hasChildren);
    }

    if (hasChildren) {
        html += `<ul class="children-branch" data-parent="${member.id}">`;
        children.forEach(child => {
            html += renderMemberWithChildren(child);
        });
        html += '</ul>';
    }

    html += '</li>';
    return html;
}

function renderCard(member, isSpouse = false, hasChildren = false) {
    const photoUrl = member.photo || `https://i.pravatar.cc/100?u=${member.id}`;
    const deceasedClass = member.is_deceased ? 'deceased' : '';

    // Extract birth year from TTL (format: "City, DD-MM-YYYY" or similar)
    let lifespan = '';
    if (member.is_deceased && member.death_year) {
        let birthYear = '';
        if (member.ttl) {
            // Try to extract year from TTL - look for 4-digit number
            const yearMatch = member.ttl.match(/(\d{4})/);
            if (yearMatch) {
                birthYear = yearMatch[1];
            }
        }
        if (birthYear) {
            const age = member.death_year - parseInt(birthYear);
            lifespan = `${birthYear} - ${member.death_year} (${age} tahun)`;
        } else {
            lifespan = `† ${member.death_year}`;
        }
    }

    // Collapse button for members with children
    const collapseBtn = hasChildren ?
        `<button class="collapse-btn" data-parent-id="${member.id}" onclick="toggleBranch(event, ${member.id})" title="Sembunyikan/Tampilkan">▼</button>` : '';

    return `
        <div class="card ${isSpouse ? 'spouse' : ''} ${deceasedClass}" data-id="${member.id}">
            ${collapseBtn}
            <div class="avatar">
                <img src="${photoUrl}" alt="${member.name}" onerror="this.src='https://i.pravatar.cc/100?u=${member.id}'">
            </div>
            <div class="info">
                <h3>${member.name}</h3>
                <p>${member.role || ''}</p>
                ${lifespan ? `<span class="lifespan">${lifespan}</span>` : ''}
            </div>
        </div>
    `;
}

// Toggle branch visibility
function toggleBranch(event, parentId) {
    event.stopPropagation(); // Prevent card click

    const branch = document.querySelector(`.children-branch[data-parent="${parentId}"]`);
    const btn = document.querySelector(`.collapse-btn[data-parent-id="${parentId}"]`);

    if (branch) {
        branch.classList.toggle('collapsed');
        if (branch.classList.contains('collapsed')) {
            btn.textContent = '▶';
            btn.title = 'Tampilkan';
        } else {
            btn.textContent = '▼';
            btn.title = 'Sembunyikan';
        }
    }
}

// Modal Functions
function openInfoModal(id) {
    const member = familyData.find(m => m.id === id);
    if (!member) return;

    currentMemberId = id;

    // Set photo
    const photoUrl = member.photo || `https://i.pravatar.cc/150?u=${member.id}`;
    const modalPhoto = document.getElementById('modalPhoto');
    modalPhoto.src = photoUrl;
    modalPhoto.onerror = function () {
        this.src = `https://i.pravatar.cc/150?u=${member.id}`;
    };

    document.getElementById('modalName').textContent = member.name;
    document.getElementById('modalTTL').textContent = member.ttl || '-';
    document.getElementById('modalAddress').textContent = member.address || '-';
    document.getElementById('modalHP').textContent = member.hp || '-';
    document.getElementById('modalKTP').textContent = member.ktp || '-';

    infoModal.style.display = 'block';
}

function openFormModal(id = null) {
    currentMemberId = id;
    const member = id ? familyData.find(m => m.id === id) : null;

    document.getElementById('formTitle').textContent = member ? 'Edit Anggota' : 'Tambah Anggota Baru';
    document.getElementById('memberId').value = member ? member.id : '';
    document.getElementById('inputName').value = member ? member.name : '';
    document.getElementById('inputRole').value = member ? (member.role || '') : '';
    document.getElementById('inputTTL').value = member ? (member.ttl || '') : '';
    document.getElementById('inputAddress').value = member ? (member.address || '') : '';
    document.getElementById('inputHP').value = member ? (member.hp || '') : '';
    document.getElementById('inputKTP').value = member ? (member.ktp || '') : '';
    document.getElementById('inputPhoto').value = member ? (member.photo || '') : '';
    document.getElementById('inputBirthOrder').value = member ? (member.birth_order || 1) : 1;
    document.getElementById('inputGeneration').value = member ? (member.generation || 1) : 1;
    document.getElementById('inputDeceased').checked = member ? (member.is_deceased || false) : false;
    document.getElementById('inputDeathYear').value = member ? (member.death_year || '') : '';

    // Show/hide death year field based on deceased status
    toggleDeathYear();

    // Populate selects FIRST, then set the selected values
    populateSelects(id);

    // Set parent and spouse values AFTER populating options
    document.getElementById('inputParent').value = member ? (member.parent_id || '') : '';
    document.getElementById('inputSpouse').value = member ? (member.spouse_id || '') : '';

    formModal.style.display = 'block';
}

// Toggle death year field visibility
function toggleDeathYear() {
    const isDeceased = document.getElementById('inputDeceased').checked;
    const deathYearGroup = document.getElementById('deathYearGroup');
    deathYearGroup.style.display = isDeceased ? 'block' : 'none';
}

function openDeleteModal(id) {
    const member = familyData.find(m => m.id === id);
    if (!member) return;

    currentMemberId = id;
    document.getElementById('deleteName').textContent = member.name;
    deleteModal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function populateSelects(excludeId = null) {
    const parentSelect = document.getElementById('inputParent');
    const spouseSelect = document.getElementById('inputSpouse');

    parentSelect.innerHTML = '<option value="">-- Tidak Ada (Root) --</option>';
    spouseSelect.innerHTML = '<option value="">-- Tidak Ada --</option>';

    familyData.forEach(member => {
        if (member.id !== excludeId) {
            parentSelect.innerHTML += `<option value="${member.id}">${member.name}</option>`;
            spouseSelect.innerHTML += `<option value="${member.id}">${member.name}</option>`;
        }
    });
}

// Form Handlers
async function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('inputName').value,
        role: document.getElementById('inputRole').value || null,
        ttl: document.getElementById('inputTTL').value || null,
        address: document.getElementById('inputAddress').value || null,
        hp: document.getElementById('inputHP').value || null,
        ktp: document.getElementById('inputKTP').value || null,
        photo: document.getElementById('inputPhoto').value || null,
        parent_id: document.getElementById('inputParent').value ? parseInt(document.getElementById('inputParent').value) : null,
        spouse_id: document.getElementById('inputSpouse').value ? parseInt(document.getElementById('inputSpouse').value) : null,
        birth_order: parseInt(document.getElementById('inputBirthOrder').value) || 1,
        generation: parseInt(document.getElementById('inputGeneration').value) || 1,
        is_deceased: document.getElementById('inputDeceased').checked,
        death_year: document.getElementById('inputDeathYear').value ? parseInt(document.getElementById('inputDeathYear').value) : null
    };

    const memberId = document.getElementById('memberId').value;
    if (memberId) {
        data.id = parseInt(memberId);
    }

    try {
        await saveMember(data);
        closeModal('formModal');
        await loadFamilyData();
    } catch (error) {
        console.error('Failed to save:', error);
        alert('Gagal menyimpan data: ' + error.message);
    }
}

async function handleDelete() {
    if (!currentMemberId) return;

    try {
        await deleteMember(currentMemberId);
        closeModal('deleteModal');
        await loadFamilyData();
    } catch (error) {
        console.error('Failed to delete:', error);
        alert('Gagal menghapus data: ' + error.message);
    }
}
