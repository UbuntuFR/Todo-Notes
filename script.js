class TodoNotesApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentFilter = 'all';
        this.editingTodoId = null;
        this.editingNoteId = null;
        this.calcExpanded = true;
        this.calcDisplay = '0';
        this.calcPrev = '';
        this.calcCurrent = '';
        this.calcOperator = null;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupTodoListeners();
        this.setupNoteListeners();
        this.setupModalListeners();
        this.setupCalculator();
        this.setupDateTime();
        this.renderTodos();
        this.renderNotes();
        this.updateStats();
    }

    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const tabId = btn.dataset.tab;
                document.getElementById(tabId).classList.add('active');
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

        document.getElementById('saveTodoBtn').addEventListener('click', () => this.saveTodoEdit());
        document.getElementById('editTodoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveTodoEdit();
        });
    }

    setupNoteListeners() {
        document.getElementById('addNoteBtn').addEventListener('click', () => this.addNote());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNoteEdit());
    }

    setupModalListeners() {
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.dataset.modal);
            });
        });

        document.querySelectorAll('.btn-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.dataset.modal);
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    // CALCULATOR METHODS
    setupCalculator() {
        const toggle = document.querySelector('.calculator-toggle');
        toggle.addEventListener('click', () => {
            const widget = document.querySelector('.calculator-widget');
            widget.classList.toggle('expanded');
            toggle.textContent = widget.classList.contains('expanded') ? '−' : '+';
        });
    }

    calcAppend(value) {
        const display = document.getElementById('calcDisplay');
        if (this.calcDisplay === '0' && value !== '.') {
            this.calcDisplay = value;
        } else if (this.calcDisplay.length < 15) {
            this.calcDisplay += value;
        }
        display.value = this.calcDisplay;
    }

    calcClear() {
        this.calcDisplay = '0';
        this.calcPrev = '';
        this.calcCurrent = '';
        this.calcOperator = null;
        document.getElementById('calcDisplay').value = '0';
    }

    calcBackspace() {
        if (this.calcDisplay.length > 1) {
            this.calcDisplay = this.calcDisplay.slice(0, -1);
        } else {
            this.calcDisplay = '0';
        }
        document.getElementById('calcDisplay').value = this.calcDisplay;
    }

    calcEqual() {
        try {
            const result = eval(this.calcDisplay);
            this.calcDisplay = result.toString();
            document.getElementById('calcDisplay').value = this.calcDisplay;
        } catch (e) {
            this.calcClear();
        }
    }

    // DATE TIME - AVEC SECONDES
    setupDateTime() {
        const updateTime = () => {
            const now = new Date();
            
            // Format Date
            const dateOptions = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            const formattedDate = now.toLocaleDateString('fr-FR', dateOptions);
            
            // Format Time avec secondes
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}:${seconds}`;
            
            // Update DOM
            const dateElement = document.getElementById('datetimeDate');
            const timeElement = document.getElementById('datetimeTime');
            
            if (dateElement) {
                dateElement.textContent = `📅 ${formattedDate}`;
            }
            if (timeElement) {
                timeElement.textContent = `🕐 ${formattedTime}`;
            }
        };
        
        updateTime(); // Init immédiat
        setInterval(updateTime, 1000); // Update chaque seconde
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        const totalEl = document.getElementById('totalTodos');
        const completedEl = document.getElementById('completedTodos');
        const percentEl = document.getElementById('progressPercent');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (percentEl) percentEl.textContent = percent + '%';
    }

    // TODO METHODS
    addTodo() {
        const input = document.getElementById('todoInput');
        const text = input.value.trim();

        if (!text) {
            alert('⚠️ Écris une tâche !');
            return;
        }

        this.todos.push({
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        });

        input.value = '';
        input.focus();
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

    deleteTodo(id) {
        if (confirm('❌ Supprimer cette tâche ?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
        }
    }

    openEditTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        this.editingTodoId = id;
        document.getElementById('editTodoInput').value = todo.text;
        document.getElementById('editTodoModal').classList.add('show');
        document.getElementById('editTodoInput').focus();
        document.getElementById('editTodoInput').select();
    }

    saveTodoEdit() {
        if (!this.editingTodoId) return;

        const text = document.getElementById('editTodoInput').value.trim();
        if (!text) {
            alert('⚠️ La tâche ne peut pas être vide !');
            return;
        }

        const todo = this.todos.find(t => t.id === this.editingTodoId);
        if (todo) {
            todo.text = text;
            this.saveTodos();
            this.renderTodos();
            this.closeModal('editTodo');
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const container = document.getElementById('todosList');
        const emptyMsg = document.getElementById('todosEmpty');
        const filteredTodos = this.getFilteredTodos();

        if (!container || !emptyMsg) return;

        container.innerHTML = '';

        if (filteredTodos.length === 0) {
            emptyMsg.classList.add('show');
            return;
        }

        emptyMsg.classList.remove('show');

        filteredTodos.forEach(todo => {
            const div = document.createElement('div');
            div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                    onchange="app.toggleTodo(${todo.id})"
                >
                <span class="todo-text">${this.escape(todo.text)}</span>
                <div class="todo-actions">
                    <button class="btn-icon" onclick="app.openEditTodo(${todo.id})">✏️</button>
                    <button class="btn-icon btn-delete" onclick="app.deleteTodo(${todo.id})">🗑️</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // NOTE METHODS
    addNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (!title || !content) {
            alert('⚠️ Remplis le titre et le contenu !');
            return;
        }

        this.notes.push({
            id: Date.now(),
            title,
            content,
            createdAt: new Date().toISOString()
        });

        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTitle').focus();
        
        this.saveNotes();
        this.renderNotes();
    }

    deleteNote(id) {
        if (confirm('❌ Supprimer cette note ?')) {
            this.notes = this.notes.filter(n => n.id !== id);
            this.saveNotes();
            this.renderNotes();
        }
    }

    openEditNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.editingNoteId = id;
        document.getElementById('editNoteTitle').value = note.title;
        document.getElementById('editNoteContent').value = note.content;
        document.getElementById('editNoteModal').classList.add('show');
        document.getElementById('editNoteTitle').focus();
        document.getElementById('editNoteTitle').select();
    }

    saveNoteEdit() {
        if (!this.editingNoteId) return;

        const title = document.getElementById('editNoteTitle').value.trim();
        const content = document.getElementById('editNoteContent').value.trim();

        if (!title || !content) {
            alert('⚠️ Remplis tous les champs !');
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
        const container = document.getElementById('notesGrid');
        const emptyMsg = document.getElementById('notesEmpty');

        if (!container || !emptyMsg) return;

        container.innerHTML = '';

        if (this.notes.length === 0) {
            emptyMsg.classList.add('show');
            return;
        }

        emptyMsg.classList.remove('show');

        this.notes.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note-card';
            
            const date = new Date(note.createdAt);
            const formattedDate = date.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });

            div.innerHTML = `
                <div class="note-title">${this.escape(note.title)}</div>
                <div class="note-content">${this.escape(note.content)}</div>
                <div class="note-footer">
                    <span class="note-date">${formattedDate}</span>
                    <div class="note-actions">
                        <button class="btn-icon" onclick="app.openEditNote(${note.id})">✏️</button>
                        <button class="btn-icon btn-delete" onclick="app.deleteNote(${note.id})">🗑️</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    // MODAL METHODS
    closeModal(modalName) {
        if (modalName === 'editTodo') {
            document.getElementById('editTodoModal').classList.remove('show');
            this.editingTodoId = null;
        } else if (modalName === 'editNote') {
            document.getElementById('editNoteModal').classList.remove('show');
            this.editingNoteId = null;
        }
    }

    // UTILITY
    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new TodoNotesApp();

