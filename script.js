// Supabase Configuration
const SUPABASE_URL = 'https://jgsnghsreiubzoajikbd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc25naHNyZWl1YnpvYWppa2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDg0NzUsImV4cCI6MjA4NDYyNDQ3NX0.vR7XDTngpsPila8O7gx6ZfaaxYX_h7Mu9aLxt7b8gJ0';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let familyData = [];
let currentMemberId = null;
let currentMarga = 'Sihite'; // Default Marga

// DOM Elements
const familyTree = document.getElementById('familyTree');
const addMemberBtn = document.getElementById('addMemberBtn');
const infoModal = document.getElementById('infoModal');
const formModal = document.getElementById('formModal');
const deleteModal = document.getElementById('deleteModal');
const memberForm = document.getElementById('memberForm');
const pageTitle = document.getElementById('pageTitle');

// Initialize
// Auth State
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkUser(); // Check auth first
    loadFamilyData();
    setupEventListeners();
    setupEventListeners();
    startLiveClock();
    setupZoomControls();
    setupMusicControl();

    // Auth Listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateUIForAuth();
    });
});

async function checkUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user || null;
    updateUIForAuth();
}

function updateUIForAuth() {
    const isAdmin = !!currentUser;
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const addBtn = document.getElementById('addMemberBtn');
    const userEmailSpan = document.getElementById('userEmail');

    if (isAdmin) {
        document.body.classList.add('is-admin');
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        addBtn.style.display = 'inline-block';

        // Show Email
        if (userEmailSpan) {
            userEmailSpan.textContent = currentUser.email;
            userEmailSpan.style.display = 'inline-block';
        }
    } else {
        document.body.classList.remove('is-admin');
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        addBtn.style.display = 'none';

        // Hide Email
        if (userEmailSpan) {
            userEmailSpan.style.display = 'none';
            userEmailSpan.textContent = '';
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    addMemberBtn.addEventListener('click', () => openFormModal());

    // Auth Event Listeners
    document.getElementById('loginBtn')?.addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'block';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        // UI updates automatically via onAuthStateChange
    });

    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    // Dev Signup (Quick way for user to register their first admin)
    document.getElementById('devSignup')?.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Isi Email dan Password dulu untuk mendaftar!');
            return;
        }

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            alert('Pendaftaran berhasil! Silakan Login sekarang.');
        } catch (err) {
            alert('Gagal daftar: ' + err.message);
        }
    });

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

// Auth Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    const oldText = btn.textContent;
    btn.textContent = 'Verifying...';

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        closeModal('loginModal');
        // UI updates via onAuthStateChange
    } catch (error) {
        alert('Login Gagal: ' + error.message);
    } finally {
        btn.textContent = oldText;
    }
}

// Live Clock Function
function startLiveClock() {
    const clockElement = document.getElementById('liveClock');
    if (!clockElement) return;

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

// Music Control
function setupMusicControl() {
    const musicBtn = document.getElementById('musicBtn');
    const audio = document.getElementById('spaceAudio');
    let isPlaying = false;

    if (!musicBtn || !audio) return;

    // Set volume low for ambiance
    audio.volume = 0.3;

    function toggleMusic() {
        if (isPlaying) {
            audio.pause();
            musicBtn.classList.remove('playing');
            musicBtn.innerHTML = '🎵'; // Play icon (stopped)
            musicBtn.title = "Play Music";
        } else {
            audio.play().then(() => {
                musicBtn.classList.add('playing');
                musicBtn.innerHTML = '🔊'; // Sound icon (playing)
                musicBtn.title = "Pause Music";
            }).catch(e => {
                console.log("Audio play failed:", e);
                // Usually due to browser policy, user needs to interact first
                alert("Klik OK untuk memutar musik luar angkasa 🎵");
                audio.play();
                musicBtn.classList.add('playing');
                musicBtn.innerHTML = '🔊';
            });
        }
        isPlaying = !isPlaying;
    }

    musicBtn.addEventListener('click', toggleMusic);

    // Try autoplay silently? No, browsers block it.
    // Let's rely on the button.
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

    if (!zoomIn) return; // safety check

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

    // Touch gesture for pinch zoom
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

async function handleFormSubmit(e) {
    e.preventDefault();

    // Visual feedback
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Menyimpan...';

    const data = {
        name: document.getElementById('inputName').value,
        role: document.getElementById('inputRole').value || null,
        marga: document.getElementById('inputMarga').value || null,
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
        saveBtn.textContent = originalText;
        // Optional: alert('Data berhasil disimpan!'); 
    } catch (error) {
        console.error('Failed to save:', error);
        alert('Gagal menyimpan data: ' + error.message);
        saveBtn.textContent = originalText;
    }
}

async function saveMember(memberData) {
    const isEdit = memberData.id;

    try {
        if (isEdit) {
            // For update, Remove ID from payload to avoid PK conflicts/issues
            const updatePayload = { ...memberData };
            delete updatePayload.id;
            delete updatePayload.created_at; // Safety check

            const { data, error } = await supabaseClient
                .from('family')
                .update(updatePayload)
                .eq('id', memberData.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } else {
            const insertPayload = { ...memberData };
            delete insertPayload.id; // Let DB handle ID generation

            const { data, error } = await supabaseClient
                .from('family')
                .insert(insertPayload)
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

// Navigation Logic
function switchMarga(margaName) {
    if (!margaName) return;
    currentMarga = margaName;
    pageTitle.textContent = `KELUARGA ${currentMarga.toUpperCase()}`;

    // Reset zoom or position if needed? For now just re-render
    renderTree();

    // Visual feedback (optional)
    console.log(`Switched to Marga: ${margaName}`);
}

// Render Functions
let renderedMembers = new Set();

function renderTree() {
    renderedMembers = new Set();
    familyTree.innerHTML = ''; // Clear previous

    if (familyData.length === 0) {
        familyTree.innerHTML = '<p style="color: #aaa; text-align: center;">Belum ada data. Klik "+ Tambah Anggota" untuk memulai.</p>';
        return;
    }

    // Identifikasi Root untuk Marga saat ini
    // Logika: Cari anggota yang:
    // 1. Marga-nya cocok dengan currentMarga (Jika null, dianggap 'Sihite')
    // 2. TIDAK punya orang tua di database, ATAU orang tuanya memiliki marga yang berbeda
    const roots = familyData.filter(m => {
        // Treat null/empty as 'Sihite' for backward compatibility
        const memberMarga = m.marga || 'Sihite';
        const isCurrentMarga = memberMarga.toLowerCase() === currentMarga.toLowerCase();

        if (!isCurrentMarga) return false;

        const parent = m.parent_id ? familyData.find(p => p.id === m.parent_id) : null;

        // Check parent's marga (also default to Sihite)
        const parentMarga = parent ? (parent.marga || 'Sihite') : null;
        const parentHasDifferentMarga = parent && parentMarga.toLowerCase() !== currentMarga.toLowerCase();

        return !m.parent_id || parentHasDifferentMarga || !parent;
    });

    // Jika tidak ada root spesifik (misal data kosong untuk marga ini), coba cari yang mengandung nama marga di Role atau Nama sebagai fallback?
    // Atau tampilkan pesan kosong.
    if (roots.length === 0) {
        // Fallback: Show all Generation 1 if default
        if (currentMarga === 'Sihite' && familyData.some(m => !m.marga)) {
            // Legacy support: if no marga set, assume Generation 1 are roots
            const gen1 = familyData.filter(m => m.generation === 1);
            let html = '<ul>';
            // Find main root (male usually)
            const mainRoot = gen1.find(m => (!m.spouse_id || m.id < m.spouse_id) && !m.parent_id) || gen1[0];
            if (mainRoot) html += renderMemberWithChildren(mainRoot);
            html += '</ul>';
            familyTree.innerHTML = html;

            // CRITICAL: Attach handlers before returning!
            setupCardClickHandlers();
            return;
        }

        familyTree.innerHTML = `<p style="color: #aaa; text-align: center;">Tidak ada data untuk Marga ${currentMarga}.</p>`;
        return;
    }

    // Sort roots by generation to ensure oldest are top
    roots.sort((a, b) => (a.generation || 1) - (b.generation || 1));

    let html = '<ul>';
    // Render each independent root found for this Marga
    roots.forEach(root => {
        // Only render if not already rendered (connections might cause duplicates)
        if (!renderedMembers.has(root.id)) {
            html += renderMemberWithChildren(root);
        }
    });
    html += '</ul>';
    familyTree.innerHTML = html;

    setupCardClickHandlers();
}

function renderMemberWithChildren(member) {
    if (renderedMembers.has(member.id)) return '';
    renderedMembers.add(member.id);

    const spouse = member.spouse_id ? familyData.find(m => m.id === member.spouse_id) : null;

    // Children: Filter those who have this member OR the spouse as parent
    // AND belong to the current Marga (Patrilineal logic)
    const children = familyData
        .filter(m => {
            // 1. Must be child of member or spouse
            const isChild = m.parent_id === member.id || (spouse && m.parent_id === spouse.id);
            if (!isChild) return false;

            // 2. Marga Check
            // If child has specific marga, it must match current view
            if (m.marga) {
                return m.marga.toLowerCase() === currentMarga.toLowerCase();
            }

            // If child has NO marga, check the parent they are linked to
            // They inherit the marga of the parent found in parent_id
            const parent = familyData.find(p => p.id === m.parent_id);
            if (parent) {
                const parentMarga = parent.marga || 'Sihite'; // Default to Sihite if null
                return parentMarga.toLowerCase() === currentMarga.toLowerCase();
            }

            return false;
        })
        .sort((a, b) => (a.birth_order || a.id) - (b.birth_order || b.id));

    const hasChildren = children.length > 0;

    let html = '<li>';

    // Render Couple
    // Removed the check that hid spouse if they were a parent (!familyData.some...)
    if (spouse && !renderedMembers.has(spouse.id)) {
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

    let lifespan = '';
    if (member.is_deceased && member.death_year) {
        let birthYear = '';
        if (member.ttl) {
            const yearMatch = member.ttl.match(/(\d{4})/);
            if (yearMatch) birthYear = yearMatch[1];
        }
        if (birthYear) {
            const age = member.death_year - parseInt(birthYear);
            lifespan = `${birthYear} - ${member.death_year} (${age} thn)`;
        } else {
            lifespan = `† ${member.death_year}`;
        }
    }

    const collapseBtn = hasChildren ?
        `<button class="collapse-btn" data-parent-id="${member.id}" onclick="toggleBranch(event, ${member.id})" title="Sembunyikan/Tampilkan">▼</button>` : '';

    // Marga Badge (Optional, but helps visualize)
    const margaDisplay = member.marga ? `<span class="marga-badge">${member.marga}</span>` : '';

    return `
        <div class="card ${isSpouse ? 'spouse' : ''} ${deceasedClass}" data-id="${member.id}" data-marga="${member.marga || ''}">
            ${collapseBtn}
            <div class="avatar">
                <img src="${photoUrl}" alt="${member.name}" onerror="this.src='https://i.pravatar.cc/100?u=${member.id}'">
            </div>
            <div class="info">
                <h3>${member.name}</h3>
                <p>${member.role || ''}</p>
                ${margaDisplay}
                ${lifespan ? `<span class="lifespan">${lifespan}</span>` : ''}
            </div>
        </div>
    `;
}

function setupCardClickHandlers() {
    // 1. Collapse Buttons (Handled via inline onclick for better reliability)


    // 2. Member Cards
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Safety check: if click originated from button, ignore (though stopPropagation should handle it)
            if (e.target.closest('.collapse-btn')) return;

            const id = parseInt(card.dataset.id);
            const memberMarga = card.dataset.marga;

            console.log('Card clicked:', id);

            if (memberMarga && memberMarga.toLowerCase() !== currentMarga.toLowerCase()) {
                switchMarga(memberMarga);
            } else {
                openInfoModal(id);
            }
        });
    });
}

function toggleBranch(event, parentId) {
    // Branch logic matches HTML structure
    const branch = document.querySelector(`.children-branch[data-parent="${parentId}"]`);
    const btn = document.querySelector(`.collapse-btn[data-parent-id="${parentId}"]`);

    if (branch) {
        branch.classList.toggle('collapsed');
        const isCollapsed = branch.classList.contains('collapsed');

        console.log(`Branch ${parentId} is now ${isCollapsed ? 'collapsed' : 'expanded'}`);

        if (btn) {
            btn.textContent = isCollapsed ? '▶' : '▼';
        }
    } else {
        console.warn('Branch not found for parent:', parentId);
    }
}

// Modal Functions
function openInfoModal(id) {
    const member = familyData.find(m => m.id === id);
    if (!member) return;

    currentMemberId = id;

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

    // Mask KTP: Show only front part, hide last 4 digits
    let ktpDisplay = '-';
    if (member.ktp && member.ktp.length > 4) {
        ktpDisplay = member.ktp.slice(0, -4) + 'XXXX';
    } else {
        ktpDisplay = member.ktp || '-';
    }
    document.getElementById('modalKTP').textContent = ktpDisplay;

    infoModal.style.display = 'block';
}

function openFormModal(id = null) {
    currentMemberId = id;
    const member = id ? familyData.find(m => m.id === id) : null;

    document.getElementById('formTitle').textContent = member ? 'Edit Anggota' : 'Tambah Anggota Baru';
    document.getElementById('memberId').value = member ? member.id : '';
    document.getElementById('inputName').value = member ? member.name : '';
    document.getElementById('inputRole').value = member ? (member.role || '') : '';
    document.getElementById('inputMarga').value = member ? (member.marga || '') : ''; // New Field
    document.getElementById('inputTTL').value = member ? (member.ttl || '') : '';
    document.getElementById('inputAddress').value = member ? (member.address || '') : '';
    document.getElementById('inputHP').value = member ? (member.hp || '') : '';
    document.getElementById('inputKTP').value = member ? (member.ktp || '') : '';
    document.getElementById('inputPhoto').value = member ? (member.photo || '') : '';
    document.getElementById('inputBirthOrder').value = member ? (member.birth_order || 1) : 1;
    document.getElementById('inputGeneration').value = member ? (member.generation || 1) : 1;
    document.getElementById('inputDeceased').checked = member ? (member.is_deceased || false) : false;
    document.getElementById('inputDeathYear').value = member ? (member.death_year || '') : '';

    toggleDeathYear();
    populateSelects(id);

    // Set parent and spouse values AFTER populating options
    const parentVal = member ? member.parent_id : '';
    const spouseVal = member ? member.spouse_id : '';

    // Explicitly select the option
    if (parentVal) {
        document.getElementById('inputParent').value = parentVal;
    } else {
        document.getElementById('inputParent').value = "";
    }

    if (spouseVal) {
        document.getElementById('inputSpouse').value = spouseVal;
    } else {
        document.getElementById('inputSpouse').value = "";
    }

    formModal.style.display = 'block';
}

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

// Duplicate removed

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
