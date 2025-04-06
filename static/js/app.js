// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const activeTasksList = document.getElementById('active-tasks-list');
    const completedTasksList = document.getElementById('completed-tasks-list');
    const taskDetailPanel = document.getElementById('task-detail-panel');
    const closeDetailPanel = document.getElementById('close-detail-panel');
    const overlay = document.getElementById('overlay');
    const taskDetailTitle = document.getElementById('task-detail-title');
    const taskDescription = document.getElementById('task-description');
    const taskStatus = document.getElementById('task-status');
    const taskCreatedAt = document.getElementById('task-created-at');
    const planContent = document.getElementById('plan-content');
    const planProgressFill = document.getElementById('plan-progress-fill');
    const planProgressText = document.getElementById('plan-progress-text');
    const agentActionsList = document.getElementById('agent-actions-list');
    const agentOutputContent = document.getElementById('agent-output-content');

    // Templates
    const taskItemTemplate = document.getElementById('task-item-template');
    const agentActionTemplate = document.getElementById('agent-action-template');

    // Session management
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem('sessionId', sessionId);
    }

    // State
    let activeTasks = [];
    let completedTasks = [];
    let currentTaskDetail = null;
    let pollingIntervals = {};

    // Event Listeners
    taskForm.addEventListener('submit', handleTaskSubmission);
    closeDetailPanel.addEventListener('click', closeTaskDetail);
    overlay.addEventListener('click', closeTaskDetail);

    // Initialize
    loadTasks();
    setupPolling();

    // Functions
    function handleTaskSubmission(event) {
        event.preventDefault();
        
        const taskDescription = taskInput.value.trim();
        if (!taskDescription) {
            alert('Please enter a task description');
            return;
        }

        submitTask(taskDescription);
        taskInput.value = '';
    }

    async function submitTask(taskDescription) {
        try {
            const response = await fetch('/api/planning/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: taskDescription
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const newTask = {
                    id: data.plan_id,
                    sessionId: sessionId,
                    description: taskDescription,
                    status: 'running',
                    progress: 0,
                    createdAt: new Date().toISOString()
                };
                
                activeTasks.push(newTask);
                renderTasks();
                
                // Start agent with computer access
                startAgent(newTask.id, taskDescription);
                
                // Start polling for updates
                startPollingForTask(newTask.id);
            } else {
                alert('Error creating task: ' + data.message);
            }
        } catch (error) {
            console.error('Error submitting task:', error);
            alert('Error submitting task. Please try again.');
        }
    }

    async function startAgent(planId, taskDescription) {
        try {
            const response = await fetch('/api/computer/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: taskDescription,
                    plan_id: planId,
                    session_id: sessionId
                })
            });

            const data = await response.json();
            
            if (data.status !== 'success') {
                alert('Error starting agent: ' + data.message);
            }
        } catch (error) {
            console.error('Error starting agent:', error);
        }
    }

    function startPollingForTask(planId) {
        // Clear any existing polling for this task
        if (pollingIntervals[planId]) {
            clearInterval(pollingIntervals[planId]);
        }
        
        // Poll for plan updates every 5 seconds
        pollingIntervals[planId] = setInterval(() => {
            fetchTaskUpdate(planId);
        }, 5000);
    }

    async function fetchTaskUpdate(planId) {
        try {
            const response = await fetch(`/api/planning/get/${planId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                updateTaskProgress(planId, data.plan);
                
                // If task detail panel is open for this task, update it
                if (currentTaskDetail && currentTaskDetail.id === planId) {
                    updateTaskDetailPanel(data.plan);
                }
            }
        } catch (error) {
            console.error('Error fetching task update:', error);
        }
    }

    function updateTaskProgress(planId, planData) {
        const taskIndex = activeTasks.findIndex(task => task.id === planId);
        
        if (taskIndex !== -1) {
            const progress = planData.progress_percentage || 0;
            activeTasks[taskIndex].progress = progress;
            
            // Check if task is completed
            if (progress >= 100) {
                const completedTask = activeTasks.splice(taskIndex, 1)[0];
                completedTask.status = 'completed';
                completedTask.completedAt = new Date().toISOString();
                completedTasks.push(completedTask);
                
                // Stop polling for this task
                if (pollingIntervals[planId]) {
                    clearInterval(pollingIntervals[planId]);
                    delete pollingIntervals[planId];
                }
            }
            
            renderTasks();
        }
    }

    function renderTasks() {
        // Clear existing content
        while (activeTasksList.firstChild) {
            if (activeTasksList.firstChild.classList && activeTasksList.firstChild.classList.contains('empty-state')) {
                break;
            }
            activeTasksList.removeChild(activeTasksList.firstChild);
        }
        
        while (completedTasksList.firstChild) {
            if (completedTasksList.firstChild.classList && completedTasksList.firstChild.classList.contains('empty-state')) {
                break;
            }
            completedTasksList.removeChild(completedTasksList.firstChild);
        }
        
        // Show/hide empty states
        const activeEmptyState = activeTasksList.querySelector('.empty-state');
        if (activeEmptyState) {
            activeEmptyState.style.display = activeTasks.length ? 'none' : 'flex';
        }
        
        const completedEmptyState = completedTasksList.querySelector('.empty-state');
        if (completedEmptyState) {
            completedEmptyState.style.display = completedTasks.length ? 'none' : 'flex';
        }
        
        // Render active tasks
        activeTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            activeTasksList.appendChild(taskElement);
        });
        
        // Render completed tasks
        completedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            completedTasksList.appendChild(taskElement);
        });
        
        // Save tasks to localStorage
        saveTasks();
    }

    function createTaskElement(task) {
        const template = taskItemTemplate.content.cloneNode(true);
        const taskItem = template.querySelector('.task-item');
        
        taskItem.dataset.sessionId = task.sessionId;
        taskItem.dataset.planId = task.id;
        
        const title = taskItem.querySelector('.task-item-title');
        title.textContent = truncateText(task.description, 50);
        
        const status = taskItem.querySelector('.task-item-status');
        status.textContent = capitalizeFirstLetter(task.status);
        status.classList.add(`status-${task.status}`);
        
        const progressFill = taskItem.querySelector('.progress-fill');
        progressFill.style.width = `${task.progress}%`;
        
        const progressText = taskItem.querySelector('.progress-text');
        progressText.textContent = `${Math.round(task.progress)}%`;
        
        const time = taskItem.querySelector('.task-item-time');
        time.textContent = formatDate(task.createdAt);
        
        const viewButton = taskItem.querySelector('.btn-view');
        viewButton.addEventListener('click', () => openTaskDetail(task));
        
        return taskItem;
    }

    function openTaskDetail(task) {
        currentTaskDetail = task;
        
        // Fetch the latest plan data
        fetch(`/api/planning/get/${task.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    updateTaskDetailPanel(data.plan);
                    
                    // Show the panel
                    taskDetailPanel.classList.add('active');
                    overlay.classList.add('active');
                }
            })
            .catch(error => {
                console.error('Error fetching task details:', error);
                alert('Error loading task details. Please try again.');
            });
    }

    function updateTaskDetailPanel(planData) {
        taskDetailTitle.textContent = truncateText(planData.task, 50);
        taskDescription.textContent = planData.task;
        
        // Set status
        const progress = planData.progress_percentage || 0;
        let status = 'Running';
        let statusClass = 'status-running';
        
        if (progress >= 100) {
            status = 'Completed';
            statusClass = 'status-completed';
        }
        
        taskStatus.textContent = status;
        taskStatus.className = 'status-badge ' + statusClass;
        
        // Set created time
        taskCreatedAt.textContent = `Created: ${formatDate(planData.created_at)}`;
        
        // Set progress
        planProgressFill.style.width = `${progress}%`;
        planProgressText.textContent = `${Math.round(progress)}%`;
        
        // Set plan content
        planContent.innerHTML = planData.html_content || marked(planData.content);
        
        // Make checkboxes in the plan content interactive
        const checkboxes = planContent.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', () => {
                updatePlanCheckbox(currentTaskDetail.id, index, checkbox.checked);
            });
        });
        
        // Fetch agent actions and output
        fetchAgentActions(currentTaskDetail.id);
    }

    async function updatePlanCheckbox(planId, stepIndex, isChecked) {
        try {
            const endpoint = isChecked ? 
                `/api/tracking/mark-completed/${planId}/${stepIndex}` : 
                `/api/tracking/mark-uncompleted/${planId}/${stepIndex}`;
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.status !== 'success') {
                alert(`Error updating plan: ${data.message}`);
                // Revert checkbox state
                const checkbox = planContent.querySelectorAll('input[type="checkbox"]')[stepIndex];
                if (checkbox) {
                    checkbox.checked = !isChecked;
                }
            }
        } catch (error) {
            console.error('Error updating plan checkbox:', error);
        }
    }

    async function fetchAgentActions(planId) {
        try {
            // This would be replaced with an actual API endpoint to get agent actions
            // For now, we'll just show a placeholder
            agentActionsList.innerHTML = '<div class="empty-state"><p>No actions recorded yet.</p></div>';
            
            // Fetch agent output from workspace logs
            const response = await fetch(`/api/computer/workspace/${sessionId}/logs`);
            const data = await response.json();
            
            if (data.status === 'success' && data.logs && data.logs.length > 0) {
                let output = '';
                data.logs.forEach(log => {
                    output += `[${formatDate(log.timestamp)}] ${log.script}\n`;
                    output += `Output: ${log.stdout}\n`;
                    if (log.stderr) {
                        output += `Error: ${log.stderr}\n`;
                    }
                    output += '---\n';
                });
                
                agentOutputContent.textContent = output;
            } else {
                agentOutputContent.textContent = 'No output available yet.';
            }
        } catch (error) {
            console.error('Error fetching agent actions:', error);
            agentOutputContent.textContent = 'Error loading agent output.';
        }
    }

    function closeTaskDetail() {
        taskDetailPanel.classList.remove('active');
        overlay.classList.remove('active');
        currentTaskDetail = null;
    }

    function loadTasks() {
        try {
            const savedActiveTasks = localStorage.getItem('activeTasks');
            const savedCompletedTasks = localStorage.getItem('completedTasks');
            
            if (savedActiveTasks) {
                activeTasks = JSON.parse(savedActiveTasks);
            }
            
            if (savedCompletedTasks) {
                completedTasks = JSON.parse(savedCompletedTasks);
            }
            
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    function saveTasks() {
        try {
            localStorage.setItem('activeTasks', JSON.stringify(activeTasks));
            localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    function setupPolling() {
        // Start polling for all active tasks
        activeTasks.forEach(task => {
            startPollingForTask(task.id);
        });
    }

    // Utility functions
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
});
