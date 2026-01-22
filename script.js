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
});

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

    let html = '<li>';

    // If has spouse, wrap both in couple-wrapper with heart connector
    if (spouse && !renderedMembers.has(spouse.id) && !familyData.some(m => m.parent_id === spouse.id)) {
        renderedMembers.add(spouse.id);
        html += '<div class="couple-wrapper">';
        html += renderCard(member);
        html += '<div class="heart-connector"><span>♥</span></div>';
        html += renderCard(spouse, true);
        html += '</div>';
    } else {
        html += renderCard(member);
    }

    if (children.length > 0) {
        html += '<ul>';
        children.forEach(child => {
            html += renderMemberWithChildren(child);
        });
        html += '</ul>';
    }

    html += '</li>';
    return html;
}

function renderCard(member, isSpouse = false) {
    const photoUrl = member.photo || `https://i.pravatar.cc/100?u=${member.id}`;
    return `
        <div class="card ${isSpouse ? 'spouse' : ''}" data-id="${member.id}">
            <div class="avatar">
                <img src="${photoUrl}" alt="${member.name}" onerror="this.src='https://i.pravatar.cc/100?u=${member.id}'">
            </div>
            <div class="info">
                <h3>${member.name}</h3>
                <p>${member.role || ''}</p>
            </div>
        </div>
    `;
}

// Modal Functions
function openInfoModal(id) {
    const member = familyData.find(m => m.id === id);
    if (!member) return;

    currentMemberId = id;
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

    // Populate selects FIRST, then set the selected values
    populateSelects(id);

    // Set parent and spouse values AFTER populating options
    document.getElementById('inputParent').value = member ? (member.parent_id || '') : '';
    document.getElementById('inputSpouse').value = member ? (member.spouse_id || '') : '';

    formModal.style.display = 'block';
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
        generation: parseInt(document.getElementById('inputGeneration').value) || 1
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
