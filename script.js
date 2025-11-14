class TodoNotesApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentFilter = 'all';
        this.editingTodoId = null;
        this.editingNoteId = null;
        this.calcDisplay = '0';
        this.calcPrev = '';
        this.calcCurrent = '';
        this.calcOperator = null;
        this.calcExpanded = true;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupTodoListeners();
        this.setupNoteListeners();
        this.setupModalListeners();
        this.setupDateTime();
        this.setupTitleClick();
        this.setupCalculator();
        this.renderTodos();
        this.renderNotes();
        this.updateStats();
    }

    setupTitleClick() {
        document.getElementById('titleBtn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });
    }

    setupTodoListeners() {
        document.getElementById('addTodoBtn').addEventListener('click', () => this.addTodo());
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTodos();
            });
        });
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (!text) {
            alert('Veuillez entrer une tâche');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleString('fr-FR')
        };

        this.todos.unshift(todo);
        this.saveTodos();
        input.value = '';
        this.renderTodos();
        this.updateStats();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }

    editTodo(id) {
        this.editingTodoId = id;
        const todo = this.todos.find(t => t.id === id);
        document.getElementById('editTodoInput').value = todo.text;
        document.getElementById('editTodoModal').style.display = 'flex';
    }

    saveTodoEdit() {
        const input = document.getElementById('editTodoInput');
        const text = input.value.trim();

        if (!text) {
            alert('Le texte ne peut pas être vide');
            return;
        }

        const todo = this.todos.find(t => t.id === this.editingTodoId);
        if (todo) {
            todo.text = text;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.closeModal('editTodo');
        }
    }

    renderTodos() {
        const list = document.getElementById('todosList');
        const empty = document.getElementById('todosEmpty');

        let filtered = this.todos;
        if (this.currentFilter === 'active') {
            filtered = this.todos.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = this.todos.filter(t => t.completed);
        }

        empty.style.display = filtered.length === 0 ? 'block' : 'none';
        list.innerHTML = filtered.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <div class="todo-content">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                        onchange="app.toggleTodo(${todo.id})">
                    <span>${this.escapeHtml(todo.text)}</span>
                </div>
                <div class="todo-actions">
                    <button onclick="app.editTodo(${todo.id})" class="btn-icon">✏️</button>
                    <button onclick="app.deleteTodo(${todo.id})" class="btn-icon">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    setupNoteListeners() {
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());
    }

    addNote() {
        const titleInput = document.getElementById('noteTitleInput');
        const contentInput = document.getElementById('noteContentInput');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert('Veuillez remplir le titre et le contenu');
            return;
        }

        const note = {
            id: Date.now(),
            title: title,
            content: content,
            createdAt: new Date().toLocaleString('fr-FR')
        };

        this.notes.unshift(note);
        this.saveNotes();
        titleInput.value = '';
        contentInput.value = '';
        this.renderNotes();
    }

    deleteNote(id) {
        this.notes = this.notes.filter(n => n.id !== id);
        this.saveNotes();
        this.renderNotes();
    }

    viewNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            document.getElementById('viewNoteTitle').textContent = note.title;
            document.getElementById('viewNoteContent').innerHTML = this.formatNoteContent(note.content);
            document.getElementById('viewNoteModal').style.display = 'flex';
            this.editingNoteId = id;
        }
    }

    formatNoteContent(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return this.escapeHtml(content).replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: underline; cursor: pointer;">${url}</a>`;
        });
    }

    editNote() {
        const note = this.notes.find(n => n.id === this.editingNoteId);
        if (note) {
            document.getElementById('editNoteTitleInput').value = note.title;
            document.getElementById('editNoteContentInput').value = note.content;
            document.getElementById('viewNoteModal').style.display = 'none';
            document.getElementById('editNoteModal').style.display = 'flex';
        }
    }

    saveNoteEdit() {
        const titleInput = document.getElementById('editNoteTitleInput');
        const contentInput = document.getElementById('editNoteContentInput');
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            alert('Le titre et le contenu ne peuvent pas être vides');
            return;
        }

        const note = this.notes.find(n => n.id === this.editingNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            this.saveNotes();
            this.renderNotes();
            this.closeModal('editNote');
        }
    }

    renderNotes() {
        const list = document.getElementById('notesList');
        const empty = document.getElementById('notesEmpty');

        empty.style.display = this.notes.length === 0 ? 'block' : 'none';
        list.innerHTML = this.notes.map(note => `
            <div class="note-card">
                <div class="note-header">
                    <h3>${this.escapeHtml(note.title)}</h3>
                    <button onclick="app.deleteNote(${note.id})" class="btn-icon">🗑️</button>
                </div>
                <div class="note-content-preview">${this.formatNotePreview(note.content)}</div>
                <small class="note-date">${note.createdAt}</small>
            </div>
        `).join('');
    }

    formatNotePreview(content) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const escaped = this.escapeHtml(content.substring(0, 100));
        return escaped.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: underline; cursor: pointer;">${url}</a>`;
        });
    }

    setupModalListeners() {
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        document.getElementById('saveTodoBtn').addEventListener('click', () => this.saveTodoEdit());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNoteEdit());
        document.getElementById('editNoteBtn').addEventListener('click', () => this.editNote());

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    closeModal(type) {
        if (type === 'editTodo') {
            document.getElementById('editTodoModal').style.display = 'none';
        } else if (type === 'editNote') {
            document.getElementById('editNoteModal').style.display = 'none';
        }
    }

    setupCalculator() {
        document.getElementById('calcToggle').addEventListener('click', () => {
            this.calcExpanded = !this.calcExpanded;
            document.getElementById('calcBody').style.display = this.calcExpanded ? 'grid' : 'none';
            document.getElementById('calcToggle').textContent = this.calcExpanded ? '−' : '+';
        });
    }

    calcAppend(value) {
        if (value === '.') {
            if (this.calcCurrent.includes('.')) return;
            if (this.calcCurrent === '') this.calcCurrent = '0';
        }
        if (['+', '-', '*', '/'].includes(value)) {
            if (this.calcCurrent === '') return;
            if (this.calcPrev !== '' && this.calcOperator) {
                this.calcEqual();
            }
            this.calcPrev = this.calcCurrent;
            this.calcOperator = value;
            this.calcCurrent = '';
        } else {
            this.calcCurrent += value;
        }
        this.updateCalcDisplay();
    }

    calcClear() {
        this.calcCurrent = '';
        this.calcPrev = '';
        this.calcOperator = null;
        this.updateCalcDisplay();
    }

    calcBackspace() {
        this.calcCurrent = this.calcCurrent.slice(0, -1);
        this.updateCalcDisplay();
    }

    calcEqual() {
        if (this.calcCurrent === '' || this.calcPrev === '' || !this.calcOperator) return;

        const prev = parseFloat(this.calcPrev);
        const current = parseFloat(this.calcCurrent);
        let result;

        switch (this.calcOperator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    alert('Division par zéro impossible');
                    this.calcClear();
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        this.calcCurrent = result.toString();
        this.calcPrev = '';
        this.calcOperator = null;
        this.updateCalcDisplay();
    }

    updateCalcDisplay() {
        document.getElementById('calcDisplay').value = this.calcCurrent || '0';
    }

    setupDateTime() {
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
    }

    updateDateTime() {
        const now = new Date();
        
        // Récupère le jour avec première lettre majuscule
        const dayName = now.toLocaleDateString('fr-FR', { weekday: 'long' });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        
        // Format date
        const dateStr = now.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const fullDate = capitalizedDay + ' ' + dateStr;
        
        // Format heure
        const timeStr = now.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        document.getElementById('datetimeDate').textContent = `📅 ${fullDate}`;
        document.getElementById('datetimeTime').textContent = `🕐 ${timeStr}`;
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('totalTodos').textContent = total;
        document.getElementById('completedTodos').textContent = completed;
        document.getElementById('progressPercent').textContent = `${percent}%`;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new TodoNotesApp();

