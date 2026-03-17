// ============================================
// RefManager - 文献管理应用
// ============================================

// 数据存储 Key
const STORAGE_KEYS = {
    REFERENCES: 'refmanager_references',
    CATEGORIES: 'refmanager_categories',
    SETTINGS: 'refmanager_settings'
};

// 文献类型映射
const REFERENCE_TYPES = {
    article: '期刊论文',
    book: '书籍',
    inproceedings: '会议论文',
    thesis: '学位论文',
    techreport: '技术报告',
    misc: '其他'
};

// 应用状态
const state = {
    references: [],
    categories: [],
    currentView: 'all',
    currentCategory: null,
    currentTag: null,
    selectedReferences: new Set(),
    editingId: null,
    searchQuery: '',
    sortBy: 'date-desc',
    detailId: null
};

// ============================================
// 初始化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEventListeners();
    render();
});

function loadData() {
    // 加载文献数据
    const savedRefs = localStorage.getItem(STORAGE_KEYS.REFERENCES);
    state.references = savedRefs ? JSON.parse(savedRefs) : [];
    
    // 加载分类数据
    const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    state.categories = savedCategories ? JSON.parse(savedCategories) : [
        { id: 'default-1', name: '机器学习', color: '#6366f1' },
        { id: 'default-2', name: '计算机视觉', color: '#22c55e' },
        { id: 'default-3', name: '自然语言处理', color: '#f59e0b' }
    ];
    
    saveCategories();
}

function saveReferences() {
    localStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(state.references));
}

function saveCategories() {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
}

// ============================================
// 事件监听
// ============================================

function initEventListeners() {
    // 导航菜单
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            state.currentView = item.dataset.view;
            state.currentCategory = null;
            state.currentTag = null;
            updateActiveNav();
            renderReferences();
        });
    });

    // 搜索
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderReferences();
    });

    // 排序
    document.getElementById('sort-select').addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderReferences();
    });

    // 添加文献按钮
    document.getElementById('add-reference-btn').addEventListener('click', () => {
        openReferenceModal();
    });

    // 添加分类按钮
    document.getElementById('add-category-btn').addEventListener('click', () => {
        openCategoryModal();
    });

    // 导入按钮
    document.getElementById('import-btn').addEventListener('click', () => {
        openModal('import-modal');
    });

    // 导出按钮
    document.getElementById('export-btn').addEventListener('click', () => {
        openModal('export-modal');
    });

    // 关闭详情面板
    document.getElementById('close-detail').addEventListener('click', () => {
        closeDetailPanel();
    });

    // 模态框关闭
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // 点击模态框背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // 文献表单提交
    document.getElementById('reference-form').addEventListener('submit', handleReferenceSubmit);

    // 分类表单提交
    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);

    // 删除分类按钮
    document.getElementById('delete-category-btn').addEventListener('click', handleDeleteCategory);

    // 表单Tab切换
    document.querySelectorAll('.form-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.form-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.form-tab-content[data-tab="${tabName}"]`).classList.add('active');
        });
    });

    // 进度滑块
    document.getElementById('ref-progress').addEventListener('input', (e) => {
        document.getElementById('progress-value').textContent = e.target.value + '%';
    });

    // 颜色选择器同步
    document.getElementById('category-color').addEventListener('input', (e) => {
        document.getElementById('category-color-text').value = e.target.value;
    });
    document.getElementById('category-color-text').addEventListener('input', (e) => {
        document.getElementById('category-color').value = e.target.value;
    });

    // 新的导入文件选择
    document.getElementById('select-import-file').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', handleFileSelect);

    // 粘贴内容导入
    document.getElementById('import-paste-btn').addEventListener('click', () => {
        const text = document.getElementById('import-paste').value;
        const format = document.getElementById('paste-format').value;
        if (text.trim()) {
            importFromText(text, format);
        } else {
            showToast('请输入要导入的内容', 'error');
        }
    });

    // 导入格式卡片点击
    document.querySelectorAll('.import-format-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.import-format-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // 导出格式按钮
    document.querySelectorAll('.export-format-btns .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            exportReferences(btn.dataset.format);
        });
    });

    // 引用格式选择
    document.getElementById('citation-style').addEventListener('change', () => {
        if (state.detailId) {
            updateCitationOutput(state.detailId);
        }
    });

    // 复制引用
    document.getElementById('copy-citation').addEventListener('click', () => {
        const output = document.getElementById('citation-output').textContent;
        navigator.clipboard.writeText(output).then(() => {
            showToast('引用已复制到剪贴板', 'success');
        });
    });

    // 标签输入
    document.getElementById('ref-tags').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target;
            const tag = input.value.trim();
            if (tag) {
                addTagToInput(tag);
                input.value = '';
            }
        }
    });
}

// ============================================
// 渲染函数
// ============================================

function render() {
    renderCategories();
    renderTags();
    renderReferences();
    updateCounts();
}

function renderCategories() {
    const container = document.getElementById('categories-list');
    const categorySelect = document.getElementById('ref-category');
    
    container.innerHTML = state.categories.map(cat => `
        <button class="category-item ${state.currentCategory === cat.id ? 'active' : ''}" 
                data-category="${cat.id}">
            <span class="category-dot" style="background: ${cat.color}"></span>
            <span>${cat.name}</span>
            <span class="count">${countByCategory(cat.id)}</span>
            <div class="category-actions">
                <span class="category-edit-btn" data-action="edit" title="编辑分类">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </span>
                <span class="category-delete-btn" data-action="delete" title="删除分类">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </span>
            </div>
        </button>
    `).join('');

    // 更新分类选择下拉框
    categorySelect.innerHTML = '<option value="">-- 选择分类 --</option>' +
        state.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

    // 分类点击事件
    container.querySelectorAll('.category-item').forEach(item => {
        // 点击分类名称筛选
        item.addEventListener('click', (e) => {
            // 如果点击的是操作按钮，不触发筛选
            if (e.target.closest('.category-actions')) {
                return;
            }
            state.currentCategory = item.dataset.category;
            state.currentView = 'category';
            state.currentTag = null;
            updateActiveNav();
            renderReferences();
            renderCategories();
        });

        // 编辑按钮
        const editBtn = item.querySelector('.category-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = item.dataset.category;
                editCategory(catId);
            });
        }

        // 删除按钮
        const deleteBtn = item.querySelector('.category-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const catId = item.dataset.category;
                confirmDeleteCategory(catId);
            });
        }
    });
}

function renderTags() {
    const container = document.getElementById('tags-cloud');
    const allTags = new Map();
    
    state.references.forEach(ref => {
        if (ref.tags) {
            ref.tags.forEach(tag => {
                allTags.set(tag, (allTags.get(tag) || 0) + 1);
            });
        }
    });

    container.innerHTML = Array.from(allTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => `
            <button class="tag-chip ${state.currentTag === tag ? 'active' : ''}" 
                    data-tag="${tag}">
                ${tag} (${count})
            </button>
        `).join('');

    container.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.tag;
            if (state.currentTag === tag) {
                state.currentTag = null;
            } else {
                state.currentTag = tag;
            }
            state.currentView = state.currentTag ? 'tag' : 'all';
            state.currentCategory = null;
            updateActiveNav();
            renderReferences();
            renderTags();
        });
    });
}

function renderReferences() {
    const container = document.getElementById('references-list');
    const emptyState = document.getElementById('empty-state');
    
    let filtered = filterReferences();
    filtered = sortReferences(filtered);

    // 更新视图标题
    updateViewTitle(filtered.length);

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.add('visible');
        return;
    }

    emptyState.classList.remove('visible');
    
    container.innerHTML = filtered.map(ref => `
        <div class="reference-card ${state.selectedReferences.has(ref.id) ? 'selected' : ''}" 
             data-id="${ref.id}">
            <div class="reference-header">
                <input type="checkbox" class="reference-checkbox" 
                       ${state.selectedReferences.has(ref.id) ? 'checked' : ''}>
                <div class="reference-info">
                    <div class="reference-title">${escapeHtml(ref.title)}</div>
                    <div class="reference-authors">${escapeHtml(ref.authors)}</div>
                    <div class="reference-meta">
                        <span class="reference-type">${REFERENCE_TYPES[ref.type] || ref.type}</span>
                        <span>${ref.year}</span>
                        ${ref.journal ? `<span>· ${escapeHtml(ref.journal)}</span>` : ''}
                        <span class="status-badge ${ref.readingStatus}">${getStatusText(ref.readingStatus)}</span>
                    </div>
                </div>
                <div class="reference-actions">
                    <button class="icon-btn favorite-btn ${ref.favorite ? 'active' : ''}" 
                            title="收藏" data-action="favorite">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </button>
                    <button class="icon-btn" title="生成引用" data-action="cite">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn" title="编辑" data-action="edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn" title="删除" data-action="delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            ${ref.tags && ref.tags.length > 0 || ref.progress > 0 ? `
                <div class="reference-footer">
                    <div class="reference-tags">
                        ${(ref.tags || []).map(tag => `<span class="reference-tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                    ${ref.progress > 0 ? `
                        <div class="reference-progress">
                            <div class="progress-bar">
                                <div class="progress-fill ${ref.progress === 100 ? 'completed' : ''}" 
                                     style="width: ${ref.progress}%"></div>
                            </div>
                            <span>${ref.progress}%</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');

    // 绑定事件
    container.querySelectorAll('.reference-card').forEach(card => {
        const id = card.dataset.id;
        
        // 点击卡片显示详情
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.reference-checkbox') && 
                !e.target.closest('.reference-actions')) {
                showDetail(id);
            }
        });

        // 复选框
        card.querySelector('.reference-checkbox').addEventListener('change', (e) => {
            if (e.target.checked) {
                state.selectedReferences.add(id);
            } else {
                state.selectedReferences.delete(id);
            }
            card.classList.toggle('selected', e.target.checked);
        });

        // 操作按钮
        card.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                handleReferenceAction(id, action);
            });
        });
    });
}

function updateViewTitle(count) {
    const titleEl = document.getElementById('view-title');
    const infoEl = document.getElementById('results-info');
    
    let title = '全部文献';
    if (state.currentView === 'reading') title = '正在阅读';
    else if (state.currentView === 'completed') title = '已完成';
    else if (state.currentView === 'favorites') title = '收藏';
    else if (state.currentCategory) {
        const cat = state.categories.find(c => c.id === state.currentCategory);
        title = cat ? cat.name : '分类';
    }
    else if (state.currentTag) {
        title = `标签: ${state.currentTag}`;
    }

    titleEl.textContent = title;
    infoEl.textContent = state.searchQuery 
        ? `找到 ${count} 条结果` 
        : `共 ${count} 篇文献`;
}

function updateActiveNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === state.currentView && !state.currentCategory && !state.currentTag);
    });
}

function updateCounts() {
    document.getElementById('total-count').textContent = state.references.length;
    document.getElementById('reading-count').textContent = state.references.filter(r => r.readingStatus === 'reading').length;
    document.getElementById('completed-count').textContent = state.references.filter(r => r.readingStatus === 'completed').length;
    document.getElementById('favorites-count').textContent = state.references.filter(r => r.favorite).length;
}

// ============================================
// 文献操作
// ============================================

function filterReferences() {
    let filtered = [...state.references];

    // 按视图筛选
    if (state.currentView === 'reading') {
        filtered = filtered.filter(r => r.readingStatus === 'reading');
    } else if (state.currentView === 'completed') {
        filtered = filtered.filter(r => r.readingStatus === 'completed');
    } else if (state.currentView === 'favorites') {
        filtered = filtered.filter(r => r.favorite);
    }

    // 按分类筛选
    if (state.currentCategory) {
        filtered = filtered.filter(r => r.category === state.currentCategory);
    }

    // 按标签筛选
    if (state.currentTag) {
        filtered = filtered.filter(r => r.tags && r.tags.includes(state.currentTag));
    }

    // 搜索
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.title.toLowerCase().includes(query) ||
            r.authors.toLowerCase().includes(query) ||
            (r.keywords && r.keywords.toLowerCase().includes(query)) ||
            (r.abstract && r.abstract.toLowerCase().includes(query))
        );
    }

    return filtered;
}

function sortReferences(refs) {
    const sorted = [...refs];
    
    switch (state.sortBy) {
        case 'date-desc':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'date-asc':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'title-asc':
            sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh'));
            break;
        case 'title-desc':
            sorted.sort((a, b) => b.title.localeCompare(a.title, 'zh'));
            break;
        case 'year-desc':
            sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;
        case 'year-asc':
            sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
            break;
    }
    
    return sorted;
}

function countByCategory(categoryId) {
    return state.references.filter(r => r.category === categoryId).length;
}

function handleReferenceAction(id, action) {
    switch (action) {
        case 'favorite':
            toggleFavorite(id);
            break;
        case 'cite':
            showCitation(id);
            break;
        case 'edit':
            editReference(id);
            break;
        case 'delete':
            deleteReference(id);
            break;
    }
}

function toggleFavorite(id) {
    const ref = state.references.find(r => r.id === id);
    if (ref) {
        ref.favorite = !ref.favorite;
        saveReferences();
        renderReferences();
        updateCounts();
        showToast(ref.favorite ? '已添加到收藏' : '已取消收藏', 'success');
    }
}

function editReference(id) {
    const ref = state.references.find(r => r.id === id);
    if (ref) {
        state.editingId = id;
        openReferenceModal(ref);
    }
}

function deleteReference(id) {
    if (confirm('确定要删除这篇文献吗？')) {
        state.references = state.references.filter(r => r.id !== id);
        state.selectedReferences.delete(id);
        saveReferences();
        render();
        closeDetailPanel();
        showToast('文献已删除', 'success');
    }
}

// ============================================
// 模态框操作
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    state.editingId = null;
    document.getElementById('reference-form').reset();
    document.getElementById('tags-input-list').innerHTML = '';
    document.getElementById('progress-value').textContent = '0%';
    
    // 重置Tab到第一个
    document.querySelectorAll('.form-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
    document.querySelectorAll('.form-tab-content').forEach((c, i) => c.classList.toggle('active', i === 0));
}

function openReferenceModal(ref = null) {
    document.getElementById('modal-title').textContent = ref ? '编辑文献' : '添加文献';
    
    if (ref) {
        document.getElementById('ref-type').value = ref.type || 'article';
        document.getElementById('ref-year').value = ref.year || '';
        document.getElementById('ref-title').value = ref.title || '';
        document.getElementById('ref-authors').value = ref.authors || '';
        document.getElementById('ref-journal').value = ref.journal || '';
        document.getElementById('ref-category').value = ref.category || '';
        document.getElementById('ref-volume').value = ref.volume || '';
        document.getElementById('ref-number').value = ref.number || '';
        document.getElementById('ref-pages').value = ref.pages || '';
        document.getElementById('ref-doi').value = ref.doi || '';
        document.getElementById('ref-url').value = ref.url || '';
        document.getElementById('ref-abstract').value = ref.abstract || '';
        document.getElementById('ref-keywords').value = ref.keywords || '';
        document.getElementById('ref-notes').value = ref.notes || '';
        document.getElementById('ref-progress').value = ref.progress || 0;
        document.getElementById('progress-value').textContent = (ref.progress || 0) + '%';
        document.querySelector(`input[name="reading-status"][value="${ref.readingStatus || 'unread'}"]`).checked = true;
        
        // 填充标签
        const tagsContainer = document.getElementById('tags-input-list');
        tagsContainer.innerHTML = '';
        if (ref.tags) {
            ref.tags.forEach(tag => addTagToInput(tag));
        }
    } else {
        document.getElementById('ref-year').value = new Date().getFullYear();
    }
    
    openModal('reference-modal');
}

function handleReferenceSubmit(e) {
    e.preventDefault();
    
    const tags = Array.from(document.querySelectorAll('#tags-input-list .tag-item'))
        .map(item => item.dataset.tag);
    
    const refData = {
        id: state.editingId || generateId(),
        type: document.getElementById('ref-type').value,
        year: parseInt(document.getElementById('ref-year').value),
        title: document.getElementById('ref-title').value,
        authors: document.getElementById('ref-authors').value,
        journal: document.getElementById('ref-journal').value,
        category: document.getElementById('ref-category').value,
        volume: document.getElementById('ref-volume').value,
        number: document.getElementById('ref-number').value,
        pages: document.getElementById('ref-pages').value,
        doi: document.getElementById('ref-doi').value,
        url: document.getElementById('ref-url').value,
        abstract: document.getElementById('ref-abstract').value,
        keywords: document.getElementById('ref-keywords').value,
        tags: tags,
        notes: document.getElementById('ref-notes').value,
        progress: parseInt(document.getElementById('ref-progress').value),
        readingStatus: document.querySelector('input[name="reading-status"]:checked').value,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (state.editingId) {
        const index = state.references.findIndex(r => r.id === state.editingId);
        if (index !== -1) {
            refData.favorite = state.references[index].favorite;
            refData.createdAt = state.references[index].createdAt;
            state.references[index] = refData;
        }
    } else {
        state.references.push(refData);
    }

    saveReferences();
    closeAllModals();
    render();
    showToast(state.editingId ? '文献已更新' : '文献已添加', 'success');
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const editId = document.getElementById('category-edit-id').value;
    const name = document.getElementById('category-name').value;
    const color = document.getElementById('category-color').value;

    if (editId) {
        // 编辑现有分类
        const index = state.categories.findIndex(c => c.id === editId);
        if (index !== -1) {
            state.categories[index].name = name;
            state.categories[index].color = color;
            showToast('分类已更新', 'success');
        }
    } else {
        // 添加新分类
        const category = {
            id: generateId(),
            name: name,
            color: color
        };
        state.categories.push(category);
        showToast('分类已添加', 'success');
    }

    saveCategories();
    closeAllModals();
    renderCategories();
    document.getElementById('category-form').reset();
}

// 打开分类模态框（新增或编辑）
function openCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const editIdInput = document.getElementById('category-edit-id');
    const deleteBtn = document.getElementById('delete-category-btn');
    const nameInput = document.getElementById('category-name');
    const colorInput = document.getElementById('category-color');
    const colorText = document.getElementById('category-color-text');

    if (categoryId) {
        // 编辑模式
        const category = state.categories.find(c => c.id === categoryId);
        if (category) {
            title.textContent = '编辑分类';
            editIdInput.value = categoryId;
            nameInput.value = category.name;
            colorInput.value = category.color;
            colorText.value = category.color;
            deleteBtn.style.display = 'inline-flex';
        }
    } else {
        // 新增模式
        title.textContent = '添加分类';
        editIdInput.value = '';
        nameInput.value = '';
        colorInput.value = '#6366f1';
        colorText.value = '#6366f1';
        deleteBtn.style.display = 'none';
    }

    openModal('category-modal');
}

// 编辑分类
function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

// 确认删除分类
function confirmDeleteCategory(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    if (!category) return;

    const refCount = countByCategory(categoryId);
    let message = `确定要删除分类"${category.name}"吗？`;
    if (refCount > 0) {
        message += `\n\n该分类下有 ${refCount} 篇文献，删除后这些文献将变为未分类状态。`;
    }

    if (confirm(message)) {
        deleteCategory(categoryId);
    }
}

// 删除分类
function deleteCategory(categoryId) {
    // 将该分类下的文献设为未分类
    state.references.forEach(ref => {
        if (ref.category === categoryId) {
            ref.category = '';
        }
    });
    saveReferences();

    // 删除分类
    state.categories = state.categories.filter(c => c.id !== categoryId);
    saveCategories();

    // 如果当前正在查看该分类，切换到全部
    if (state.currentCategory === categoryId) {
        state.currentCategory = null;
        state.currentView = 'all';
    }

    closeAllModals();
    render();
    showToast('分类已删除', 'success');
}

// 处理模态框内的删除按钮
function handleDeleteCategory() {
    const editId = document.getElementById('category-edit-id').value;
    if (editId) {
        confirmDeleteCategory(editId);
    }
}

function addTagToInput(tag) {
    const container = document.getElementById('tags-input-list');
    const existing = container.querySelector(`[data-tag="${tag}"]`);
    if (existing) return;

    const tagEl = document.createElement('span');
    tagEl.className = 'tag-item';
    tagEl.dataset.tag = tag;
    tagEl.innerHTML = `
        ${escapeHtml(tag)}
        <button type="button">&times;</button>
    `;
    
    tagEl.querySelector('button').addEventListener('click', () => tagEl.remove());
    container.appendChild(tagEl);
}

// ============================================
// 详情面板
// ============================================

function showDetail(id) {
    const ref = state.references.find(r => r.id === id);
    if (!ref) return;

    state.detailId = id;
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    const category = state.categories.find(c => c.id === ref.category);

    content.innerHTML = `
        <div class="detail-section">
            <div class="detail-title">${escapeHtml(ref.title)}</div>
            <div class="detail-authors">${escapeHtml(ref.authors)}</div>
        </div>

        <div class="detail-section">
            <div class="detail-section-title">基本信息</div>
            <div class="detail-meta-grid">
                <div class="detail-meta-item">
                    <span class="detail-meta-label">类型</span>
                    <span class="detail-meta-value">${REFERENCE_TYPES[ref.type] || ref.type}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">年份</span>
                    <span class="detail-meta-value">${ref.year}</span>
                </div>
                ${ref.journal ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">期刊/出版社</span>
                        <span class="detail-meta-value">${escapeHtml(ref.journal)}</span>
                    </div>
                ` : ''}
                ${category ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">分类</span>
                        <span class="detail-meta-value">
                            <span class="category-dot" style="background: ${category.color}; display: inline-block; width: 8px; height: 8px; margin-right: 4px;"></span>
                            ${escapeHtml(category.name)}
                        </span>
                    </div>
                ` : ''}
                ${ref.volume ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">卷/期</span>
                        <span class="detail-meta-value">${ref.volume}${ref.number ? `(${ref.number})` : ''}</span>
                    </div>
                ` : ''}
                ${ref.pages ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">页码</span>
                        <span class="detail-meta-value">${ref.pages}</span>
                    </div>
                ` : ''}
                ${ref.doi ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">DOI</span>
                        <span class="detail-meta-value">
                            <a href="https://doi.org/${ref.doi}" target="_blank">${ref.doi}</a>
                        </span>
                    </div>
                ` : ''}
                ${ref.url ? `
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">URL</span>
                        <span class="detail-meta-value">
                            <a href="${ref.url}" target="_blank">查看链接</a>
                        </span>
                    </div>
                ` : ''}
            </div>
        </div>

        ${ref.abstract ? `
            <div class="detail-section">
                <div class="detail-section-title">摘要</div>
                <div class="detail-abstract">${escapeHtml(ref.abstract)}</div>
            </div>
        ` : ''}

        ${ref.keywords ? `
            <div class="detail-section">
                <div class="detail-section-title">关键词</div>
                <div class="reference-tags">
                    ${ref.keywords.split(',').map(k => `<span class="reference-tag">${escapeHtml(k.trim())}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${ref.tags && ref.tags.length > 0 ? `
            <div class="detail-section">
                <div class="detail-section-title">标签</div>
                <div class="reference-tags">
                    ${ref.tags.map(t => `<span class="reference-tag">${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        <div class="detail-section">
            <div class="detail-section-title">阅读进度</div>
            <div class="detail-progress">
                <div class="detail-progress-bar">
                    <div class="detail-progress-fill" style="width: ${ref.progress || 0}%"></div>
                </div>
                <span class="detail-progress-text">${ref.progress || 0}%</span>
            </div>
            <div style="margin-top: 8px;">
                <span class="status-badge ${ref.readingStatus}">${getStatusText(ref.readingStatus)}</span>
            </div>
        </div>

        ${ref.notes ? `
            <div class="detail-section">
                <div class="detail-section-title">阅读笔记</div>
                <div class="detail-notes">${escapeHtml(ref.notes)}</div>
            </div>
        ` : ''}

        <div class="detail-actions">
            <button class="btn btn-secondary" onclick="editReference('${id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                编辑
            </button>
            <button class="btn btn-primary" onclick="showCitation('${id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"></path>
                </svg>
                引用
            </button>
        </div>
    `;

    panel.classList.add('open');
}

function closeDetailPanel() {
    document.getElementById('detail-panel').classList.remove('open');
    state.detailId = null;
}

// ============================================
// 引用生成
// ============================================

function showCitation(id) {
    state.detailId = id;
    updateCitationOutput(id);
    openModal('citation-modal');
}

function updateCitationOutput(id) {
    const ref = state.references.find(r => r.id === id);
    if (!ref) return;

    const style = document.getElementById('citation-style').value;
    const citation = generateCitation(ref, style);
    document.getElementById('citation-output').textContent = citation;
}

function generateCitation(ref, style) {
    const authors = ref.authors || '';
    const title = ref.title || '';
    const year = ref.year || '';
    const journal = ref.journal || '';
    const volume = ref.volume || '';
    const number = ref.number || '';
    const pages = ref.pages || '';
    const doi = ref.doi || '';

    switch (style) {
        case 'apa':
            return `${formatAuthorsAPA(authors)} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${number ? `(${number})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
        
        case 'mla':
            return `${formatAuthorsMLA(authors)}. "${title}." ${journal}${volume ? `, vol. ${volume}` : ''}${number ? `, no. ${number}` : ''}, ${year}${pages ? `, pp. ${pages}` : ''}.`;
        
        case 'chicago':
            return `${formatAuthorsChicago(authors)}. "${title}." ${journal} ${volume}${number ? `, no. ${number}` : ''} (${year})${pages ? `: ${pages}` : ''}.`;
        
        case 'harvard':
            return `${formatAuthorsHarvard(authors)} (${year}) '${title}', ${journal}${volume ? `, ${volume}` : ''}${number ? `(${number})` : ''}${pages ? `, pp. ${pages}` : ''}.`;
        
        case 'ieee':
            return `${formatAuthorsIEEE(authors)}, "${title}," ${journal}${volume ? `, vol. ${volume}` : ''}${number ? `, no. ${number}` : ''}${pages ? `, pp. ${pages}` : ''}, ${year}.`;
        
        case 'gb':
            return `${formatAuthorsGB(authors)}. ${title}[J]. ${journal}, ${year}${volume ? `, ${volume}` : ''}${number ? `(${number})` : ''}${pages ? `: ${pages}` : ''}.`;
        
        default:
            return `${authors}. ${title}. ${journal}, ${year}.`;
    }
}

function formatAuthorsAPA(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length === 1) return authorList[0];
    if (authorList.length === 2) return `${authorList[0]} & ${authorList[1]}`;
    if (authorList.length > 7) {
        return `${authorList.slice(0, 6).join(', ')}, ... ${authorList[authorList.length - 1]}`;
    }
    return `${authorList.slice(0, -1).join(', ')}, & ${authorList[authorList.length - 1]}`;
}

function formatAuthorsMLA(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length === 1) return authorList[0];
    if (authorList.length === 2) return `${authorList[0]} and ${authorList[1]}`;
    return `${authorList[0]}, et al.`;
}

function formatAuthorsChicago(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length <= 3) return authorList.join(', ');
    return `${authorList[0]} et al.`;
}

function formatAuthorsHarvard(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length === 1) return authorList[0];
    if (authorList.length === 2) return `${authorList[0]} and ${authorList[1]}`;
    return `${authorList[0]} et al.`;
}

function formatAuthorsIEEE(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length <= 3) return authorList.join(', ');
    return `${authorList[0]} et al.`;
}

function formatAuthorsGB(authors) {
    const authorList = authors.split(';').map(a => a.trim());
    if (authorList.length <= 3) return authorList.join(', ');
    return `${authorList.slice(0, 3).join(', ')}, 等`;
}

// ============================================
// BibTeX 导入/导出
// ============================================

// 待导入的文件列表
let pendingImportFiles = [];

// 处理文件选择
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const fileListContainer = document.getElementById('import-file-list');
    
    pendingImportFiles = files;
    
    fileListContainer.innerHTML = files.map((file, index) => `
        <div class="import-file-item" data-index="${index}">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <span class="remove-file" data-index="${index}">&times;</span>
        </div>
    `).join('');

    // 移除文件按钮
    fileListContainer.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            pendingImportFiles.splice(index, 1);
            handleFileSelect({ target: { files: pendingImportFiles } });
        });
    });

    // 如果有文件，立即开始导入
    if (files.length > 0) {
        processImportFiles(files);
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 处理导入文件
async function processImportFiles(files) {
    let totalImported = 0;
    let errors = [];

    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        
        try {
            const content = await readFileContent(file);
            let imported = 0;

            switch (ext) {
                case 'bib':
                    imported = importBibTeX(content, false);
                    break;
                case 'ris':
                    imported = importRIS(content, false);
                    break;
                case 'xml':
                    imported = importEndNoteXML(content, false);
                    break;
                case 'json':
                    imported = importJSON(content, false);
                    break;
                case 'pdf':
                    imported = await importPDF(file, false);
                    break;
                case 'doc':
                case 'docx':
                    imported = await importDOC(file, false);
                    break;
                default:
                    errors.push(`不支持的文件格式: ${file.name}`);
            }
            
            totalImported += imported;
        } catch (e) {
            errors.push(`导入失败: ${file.name} - ${e.message}`);
            console.error(e);
        }
    }

    saveReferences();
    closeAllModals();
    render();

    if (totalImported > 0) {
        showToast(`成功导入 ${totalImported} 篇文献`, 'success');
    }
    if (errors.length > 0) {
        showToast(errors.join('\n'), 'error');
    }
}

// 读取文件内容
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 从粘贴内容导入
function importFromText(text, format) {
    let imported = 0;
    
    try {
        switch (format) {
            case 'bibtex':
                imported = importBibTeX(text, true);
                break;
            case 'ris':
                imported = importRIS(text, true);
                break;
            case 'endnote':
                imported = importEndNoteXML(text, true);
                break;
            default:
                showToast('不支持的格式', 'error');
                return;
        }
    } catch (e) {
        showToast('导入失败：' + e.message, 'error');
        console.error(e);
    }
}

function importBibTeX(text, showMessage = true) {
    try {
        const entries = parseBibTeX(text);
        let imported = 0;

        entries.forEach(entry => {
            const ref = {
                id: generateId(),
                type: entry.type || 'article',
                title: entry.title || '',
                authors: entry.author || '',
                year: parseInt(entry.year) || new Date().getFullYear(),
                journal: entry.journal || entry.booktitle || entry.publisher || '',
                volume: entry.volume || '',
                number: entry.number || '',
                pages: entry.pages || '',
                doi: entry.doi || '',
                url: entry.url || '',
                abstract: entry.abstract || '',
                keywords: entry.keywords || '',
                tags: [],
                notes: '',
                progress: 0,
                readingStatus: 'unread',
                favorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            state.references.push(ref);
            imported++;
        });

        if (showMessage) {
            saveReferences();
            closeAllModals();
            render();
            showToast(`成功导入 ${imported} 篇文献`, 'success');
        }
        
        return imported;
    } catch (e) {
        if (showMessage) {
            showToast('导入失败：BibTeX 格式不正确', 'error');
        }
        console.error(e);
        return 0;
    }
}

// 导入 RIS 格式
function importRIS(text, showMessage = true) {
    try {
        const entries = parseRIS(text);
        let imported = 0;

        entries.forEach(entry => {
            const ref = {
                id: generateId(),
                type: mapRISType(entry.TY) || 'article',
                title: entry.TI || entry.T1 || '',
                authors: (entry.AU || []).join('; '),
                year: parseInt(entry.PY || entry.Y1) || new Date().getFullYear(),
                journal: entry.JO || entry.JF || entry.T2 || '',
                volume: entry.VL || '',
                number: entry.IS || '',
                pages: entry.SP ? (entry.EP ? `${entry.SP}-${entry.EP}` : entry.SP) : '',
                doi: entry.DO || '',
                url: entry.UR || '',
                abstract: entry.AB || '',
                keywords: (entry.KW || []).join(', '),
                tags: [],
                notes: entry.N1 || '',
                progress: 0,
                readingStatus: 'unread',
                favorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            state.references.push(ref);
            imported++;
        });

        if (showMessage) {
            saveReferences();
            closeAllModals();
            render();
            showToast(`成功导入 ${imported} 篇文献`, 'success');
        }
        
        return imported;
    } catch (e) {
        if (showMessage) {
            showToast('导入失败：RIS 格式不正确', 'error');
        }
        console.error(e);
        return 0;
    }
}

// 解析 RIS 格式
function parseRIS(text) {
    const entries = [];
    const lines = text.split('\n');
    let currentEntry = null;
    let currentField = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('TY  -')) {
            if (currentEntry) entries.push(currentEntry);
            currentEntry = { TY: trimmed.substring(6).trim() };
            currentField = 'TY';
        } else if (trimmed.startsWith('ER  -')) {
            if (currentEntry) entries.push(currentEntry);
            currentEntry = null;
        } else if (currentEntry) {
            const match = trimmed.match(/^([A-Z][A-Z0-9])\s+-\s+(.*)$/);
            if (match) {
                const [, tag, value] = match;
                currentField = tag;
                if (['AU', 'KW'].includes(tag)) {
                    if (!currentEntry[tag]) currentEntry[tag] = [];
                    currentEntry[tag].push(value);
                } else {
                    currentEntry[tag] = value;
                }
            }
        }
    }

    if (currentEntry) entries.push(currentEntry);
    return entries;
}

// RIS 类型映射
function mapRISType(risType) {
    const typeMap = {
        'JOUR': 'article',
        'BOOK': 'book',
        'CHAP': 'inbook',
        'CONF': 'inproceedings',
        'THES': 'thesis',
        'RPRT': 'techreport',
        'ELEC': 'misc',
        'GEN': 'misc'
    };
    return typeMap[risType] || 'misc';
}

// 导入 EndNote XML 格式
function importEndNoteXML(text, showMessage = true) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');
        const records = doc.querySelectorAll('record');
        let imported = 0;

        records.forEach(record => {
            const getField = (selector) => {
                const el = record.querySelector(selector);
                return el ? el.textContent.trim() : '';
            };

            const authors = [];
            record.querySelectorAll('contributors author').forEach(a => {
                authors.push(a.textContent.trim());
            });

            const keywords = [];
            record.querySelectorAll('keywords keyword').forEach(k => {
                keywords.push(k.textContent.trim());
            });

            const ref = {
                id: generateId(),
                type: mapEndNoteType(getField('ref-type')),
                title: getField('titles title'),
                authors: authors.join('; '),
                year: parseInt(getField('dates year')) || new Date().getFullYear(),
                journal: getField('periodical full-title') || getField('secondary-title'),
                volume: getField('volume'),
                number: getField('number'),
                pages: getField('pages'),
                doi: getField('electronic-resource-num'),
                url: getField('urls related-urls url'),
                abstract: getField('abstract'),
                keywords: keywords.join(', '),
                tags: [],
                notes: getField('notes'),
                progress: 0,
                readingStatus: 'unread',
                favorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (ref.title) {
                state.references.push(ref);
                imported++;
            }
        });

        if (showMessage) {
            saveReferences();
            closeAllModals();
            render();
            showToast(`成功导入 ${imported} 篇文献`, 'success');
        }

        return imported;
    } catch (e) {
        if (showMessage) {
            showToast('导入失败：EndNote XML 格式不正确', 'error');
        }
        console.error(e);
        return 0;
    }
}

// EndNote 类型映射
function mapEndNoteType(endnoteType) {
    const typeMap = {
        '17': 'article',
        '6': 'book',
        '5': 'inbook',
        '10': 'inproceedings',
        '32': 'thesis',
        '27': 'techreport'
    };
    return typeMap[endnoteType] || 'misc';
}

// 导入 JSON 格式
function importJSON(text, showMessage = true) {
    try {
        const data = JSON.parse(text);
        const entries = Array.isArray(data) ? data : [data];
        let imported = 0;

        entries.forEach(entry => {
            const ref = {
                id: generateId(),
                type: entry.type || 'article',
                title: entry.title || '',
                authors: entry.authors || entry.author || '',
                year: parseInt(entry.year) || new Date().getFullYear(),
                journal: entry.journal || '',
                volume: entry.volume || '',
                number: entry.number || '',
                pages: entry.pages || '',
                doi: entry.doi || '',
                url: entry.url || '',
                abstract: entry.abstract || '',
                keywords: entry.keywords || '',
                tags: entry.tags || [],
                notes: entry.notes || '',
                progress: entry.progress || 0,
                readingStatus: entry.readingStatus || 'unread',
                favorite: entry.favorite || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (ref.title) {
                state.references.push(ref);
                imported++;
            }
        });

        if (showMessage) {
            saveReferences();
            closeAllModals();
            render();
            showToast(`成功导入 ${imported} 篇文献`, 'success');
        }

        return imported;
    } catch (e) {
        if (showMessage) {
            showToast('导入失败：JSON 格式不正确', 'error');
        }
        console.error(e);
        return 0;
    }
}

// 导入 PDF（提取基本信息）
async function importPDF(file, showMessage = true) {
    // 由于浏览器环境限制，无法完整解析 PDF
    // 这里创建一个基于文件名的占位记录
    const fileName = file.name.replace('.pdf', '');
    
    const ref = {
        id: generateId(),
        type: 'article',
        title: fileName,
        authors: '',
        year: new Date().getFullYear(),
        journal: '',
        volume: '',
        number: '',
        pages: '',
        doi: '',
        url: '',
        abstract: '',
        keywords: '',
        tags: [],
        notes: `从 PDF 文件导入: ${file.name}\n\n请手动补充文献详细信息。`,
        progress: 0,
        readingStatus: 'unread',
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceFile: file.name
    };

    state.references.push(ref);

    if (showMessage) {
        saveReferences();
        closeAllModals();
        render();
        showToast('PDF 文献已导入，请手动补充详细信息', 'info');
    }

    return 1;
}

// 导入 DOC/DOCX（提取基本信息）
async function importDOC(file, showMessage = true) {
    const fileName = file.name.replace(/\.(doc|docx)$/i, '');
    
    const ref = {
        id: generateId(),
        type: 'misc',
        title: fileName,
        authors: '',
        year: new Date().getFullYear(),
        journal: '',
        volume: '',
        number: '',
        pages: '',
        doi: '',
        url: '',
        abstract: '',
        keywords: '',
        tags: [],
        notes: `从 Word 文档导入: ${file.name}\n\n请手动补充文献详细信息。`,
        progress: 0,
        readingStatus: 'unread',
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceFile: file.name
    };

    state.references.push(ref);

    if (showMessage) {
        saveReferences();
        closeAllModals();
        render();
        showToast('Word 文档已导入，请手动补充详细信息', 'info');
    }

    return 1;
}

function parseBibTeX(text) {
    const entries = [];
    const entryRegex = /@(\w+)\s*\{([^,]*),([^@]*)\}/g;
    let match;

    while ((match = entryRegex.exec(text)) !== null) {
        const type = match[1].toLowerCase();
        const fields = {};
        const content = match[3];

        // Parse fields
        const fieldRegex = /(\w+)\s*=\s*[{"']?([^},"\n]+(?:\{[^}]*\})?[^},"\n]*)[}"']?/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(content)) !== null) {
            let value = fieldMatch[2].trim();
            // Clean up BibTeX formatting
            value = value.replace(/[\{\}]/g, '').trim();
            fields[fieldMatch[1].toLowerCase()] = value;
        }

        fields.type = type;
        entries.push(fields);
    }

    return entries;
}

function exportReferences(format) {
    const scope = document.querySelector('input[name="export-scope"]:checked').value;
    let refs = [];

    if (scope === 'all') {
        refs = state.references;
    } else if (scope === 'selected') {
        refs = state.references.filter(r => state.selectedReferences.has(r.id));
    } else if (scope === 'current') {
        refs = filterReferences();
    }

    if (refs.length === 0) {
        showToast('没有可导出的文献', 'error');
        return;
    }

    let content, filename, mimeType;

    if (format === 'bibtex') {
        content = refs.map(ref => generateBibTeXEntry(ref)).join('\n\n');
        filename = 'references.bib';
        mimeType = 'application/x-bibtex';
    } else {
        content = JSON.stringify(refs, null, 2);
        filename = 'references.json';
        mimeType = 'application/json';
    }

    downloadFile(content, filename, mimeType);
    closeAllModals();
    showToast(`成功导出 ${refs.length} 篇文献`, 'success');
}

function generateBibTeXEntry(ref) {
    const key = generateBibTeXKey(ref);
    let entry = `@${ref.type}{${key},\n`;
    
    if (ref.title) entry += `  title = {${ref.title}},\n`;
    if (ref.authors) entry += `  author = {${ref.authors.replace(/;/g, ' and ')}},\n`;
    if (ref.year) entry += `  year = {${ref.year}},\n`;
    if (ref.journal) entry += `  journal = {${ref.journal}},\n`;
    if (ref.volume) entry += `  volume = {${ref.volume}},\n`;
    if (ref.number) entry += `  number = {${ref.number}},\n`;
    if (ref.pages) entry += `  pages = {${ref.pages}},\n`;
    if (ref.doi) entry += `  doi = {${ref.doi}},\n`;
    if (ref.url) entry += `  url = {${ref.url}},\n`;
    if (ref.abstract) entry += `  abstract = {${ref.abstract}},\n`;
    if (ref.keywords) entry += `  keywords = {${ref.keywords}},\n`;
    
    // Remove trailing comma and newline
    entry = entry.slice(0, -2) + '\n}';
    
    return entry;
}

function generateBibTeXKey(ref) {
    const firstAuthor = (ref.authors || 'unknown').split(';')[0].split(',')[0].trim().toLowerCase().replace(/\s+/g, '');
    const year = ref.year || 'xxxx';
    const titleWord = (ref.title || 'untitled').split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    return `${firstAuthor}${year}${titleWord}`;
}

// ============================================
// 工具函数
// ============================================

function generateId() {
    return 'ref_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusText(status) {
    const statusMap = {
        'unread': '未读',
        'reading': '阅读中',
        'completed': '已完成'
    };
    return statusMap[status] || '未读';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 使函数全局可用（用于详情面板内的按钮）
window.editReference = editReference;
window.showCitation = showCitation;
