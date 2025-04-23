

// Memory system configuration
const TOTAL_MEMORY = 1024; 
let memoryBlocks = [{ start: 0, end: TOTAL_MEMORY - 1, size: TOTAL_MEMORY, type: 'free', process: null }];
let processes = {};
let simulationInterval = null;


document.addEventListener('DOMContentLoaded', () => {
    initializeMemory();
    updateSimulationSpeedDisplay();
    
    
    document.getElementById('simSpeed').addEventListener('input', updateSimulationSpeedDisplay);
});


function initializeMemory() {
    updateMemoryVisualization();
    updateStats();
}


function updateMemoryVisualization() {
    const memoryBlocksContainer = document.getElementById('memoryBlocks');
    memoryBlocksContainer.innerHTML = '';
    
    memoryBlocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = `block ${block.type}`;
        
        
        const blockWidth = (block.size / TOTAL_MEMORY) * 100;
        blockElement.style.width = `${blockWidth}%`;
        
       
        const blockInfo = document.createElement('div');
        blockInfo.className = 'block-info';
        
        if (block.type === 'free') {
            blockInfo.textContent = `${block.size} KB`;
        } else {
            blockInfo.textContent = `${block.process} (${block.size} KB)`;
        }
        
       
        if (blockWidth > 5) {
            blockElement.appendChild(blockInfo);
        }
        
        memoryBlocksContainer.appendChild(blockElement);
    });
}

// Update memory statistics
function updateStats() {
    let usedMemory = 0;
    let freeMemorySize = 0;
    let fragmentCount = 0;
    
    memoryBlocks.forEach(block => {
        if (block.type === 'allocated') {
            usedMemory += block.size;
        } else {
            freeMemorySize += block.size;
            fragmentCount++;
        }
    });
    
    const usagePercentage = (usedMemory / TOTAL_MEMORY) * 100;
    
    document.getElementById('memoryUsage').textContent = `${usagePercentage.toFixed(1)}%`;
    document.getElementById('freeMemory').textContent = `${freeMemorySize} KB`;
    document.getElementById('fragments').textContent = fragmentCount;
    document.getElementById('totalProcesses').textContent = Object.keys(processes).length;
    
    updateProcessList();
}

// Update the process list table
function updateProcessList() {
    const processListBody = document.getElementById('processList').getElementsByTagName('tbody')[0];
    processListBody.innerHTML = '';
    
    Object.keys(processes).forEach(processId => {
        const process = processes[processId];
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = processId;
        
        const baseAddressCell = document.createElement('td');
        baseAddressCell.textContent = process.start;
        
        const sizeCell = document.createElement('td');
        sizeCell.textContent = `${process.size} KB`;
        
        const actionsCell = document.createElement('td');
        const deallocateBtn = document.createElement('button');
        deallocateBtn.className = 'btn-danger btn-sm';
        deallocateBtn.textContent = 'Deallocate';
        deallocateBtn.onclick = () => deallocateMemory(processId);
        
        actionsCell.appendChild(deallocateBtn);
        
        row.appendChild(idCell);
        row.appendChild(baseAddressCell);
        row.appendChild(sizeCell);
        row.appendChild(actionsCell);
        
        processListBody.appendChild(row);
    });
}


function allocateMemory(processId = null, size = null) {
    
    processId = processId || document.getElementById('processId').value.trim();
    size = size || parseInt(document.getElementById('size').value);
    const algorithm = document.getElementById('algorithm').value;
    

    if (!processId) {
        showNotification('Please enter a Process ID', 'error');
        return;
    }
    
    if (!size || size < 4) {
        showNotification('Please enter a valid size (minimum 4KB)', 'error');
        return;
    }
    
    if (processes[processId]) {
        showNotification(`Process ID "${processId}" already exists`, 'error');
        return;
    }
    
   
    let allocated = false;
    
    switch (algorithm) {
        case 'first-fit':
            allocated = firstFitAllocation(processId, size);
            break;
        case 'best-fit':
            allocated = bestFitAllocation(processId, size);
            break;
        case 'worst-fit':
            allocated = worstFitAllocation(processId, size);
            break;
        default:
            allocated = firstFitAllocation(processId, size);
    }
    
    if (allocated) {
        showNotification(`Memory allocated for process "${processId}" (${size} KB)`, 'success');
        document.getElementById('processId').value = '';
        document.getElementById('size').value = '';
    } else {
        showNotification(`Not enough continuous memory for ${size} KB`, 'error');
    }
    
    updateMemoryVisualization();
    updateStats();
}

// First Fit Algorithm
function firstFitAllocation(processId, size) {
    for (let i = 0; i < memoryBlocks.length; i++) {
        const block = memoryBlocks[i];
        
        if (block.type === 'free' && block.size >= size) {
           
            allocateBlock(i, processId, size);
            return true;
        }
    }
    
    return false; 
}


function bestFitAllocation(processId, size) {
    let bestFitIndex = -1;
    let bestFitSize = Infinity;
    
    
    for (let i = 0; i < memoryBlocks.length; i++) {
        const block = memoryBlocks[i];
        
        if (block.type === 'free' && block.size >= size && block.size < bestFitSize) {
            bestFitIndex = i;
            bestFitSize = block.size;
        }
    }
    
    if (bestFitIndex !== -1) {
        allocateBlock(bestFitIndex, processId, size);
        return true;
    }
    
    return false; 
}


function worstFitAllocation(processId, size) {
    let worstFitIndex = -1;
    let worstFitSize = -1;
    
 
    for (let i = 0; i < memoryBlocks.length; i++) {
        const block = memoryBlocks[i];
        
        if (block.type === 'free' && block.size >= size && block.size > worstFitSize) {
            worstFitIndex = i;
            worstFitSize = block.size;
        }
    }
    
    if (worstFitIndex !== -1) {
        allocateBlock(worstFitIndex, processId, size);
        return true;
    }
    
    return false; 
}


function allocateBlock(blockIndex, processId, size) {
    const block = memoryBlocks[blockIndex];
    
    if (block.size === size) {
        block.type = 'allocated';
        block.process = processId;
    } else {
        const remainingSize = block.size - size;
        const allocatedBlock = {
            start: block.start,
            end: block.start + size - 1,
            size: size,
            type: 'allocated',
            process: processId
        };
        
        const remainingBlock = {
            start: block.start + size,
            end: block.end,
            size: remainingSize,
            type: 'free',
            process: null
        };
        
        
        memoryBlocks.splice(blockIndex, 1, allocatedBlock, remainingBlock);
    }
    
    processes[processId] = {
        start: block.start,
        size: size
    };
}


function deallocateMemory(processId = null) {
    processId = processId || document.getElementById('deallocateId').value.trim();
    
    if (!processId) {
        showNotification('Please enter a Process ID to deallocate', 'error');
        return;
    }
    
    if (!processes[processId]) {
        showNotification(`Process "${processId}" not found`, 'error');
        return;
    }
    
 
    for (let i = 0; i < memoryBlocks.length; i++) {
        const block = memoryBlocks[i];
        
        if (block.type === 'allocated' && block.process === processId) {
          
            block.type = 'free';
            block.process = null;
       
            mergeAdjacentFreeBlocks();
            
           
            delete processes[processId];
            
            showNotification(`Memory deallocated for process "${processId}"`, 'success');
            document.getElementById('deallocateId').value = '';
            
            updateMemoryVisualization();
            updateStats();
            return;
        }
    }
}


function mergeAdjacentFreeBlocks() {
    let i = 0;
    
    while (i < memoryBlocks.length - 1) {
        const currentBlock = memoryBlocks[i];
        const nextBlock = memoryBlocks[i + 1];
        
        if (currentBlock.type === 'free' && nextBlock.type === 'free') {
            
            currentBlock.end = nextBlock.end;
            currentBlock.size = currentBlock.end - currentBlock.start + 1;
            
           
            memoryBlocks.splice(i + 1, 1);
        } else {
            i++;
        }
    }
}


function compactMemory() {
    const freeBlocks = memoryBlocks.filter(block => block.type === 'free');
    
    if (freeBlocks.length <= 1) {
        showNotification('No fragmentation to compact', 'error');
        return;
    }
    
    const allocatedBlocks = memoryBlocks.filter(block => block.type === 'allocated');
    
    if (allocatedBlocks.length === 0) {
        showNotification('No allocated blocks to compact', 'error');
        return;
    }
    

    memoryBlocks = [{ start: 0, end: TOTAL_MEMORY - 1, size: TOTAL_MEMORY, type: 'free', process: null }];
   
    processes = {};
    
   
    let currentAddress = 0;
    
    allocatedBlocks.forEach(block => {
        const processId = block.process;
        const size = block.size;
        
       
        const newBlock = {
            start: currentAddress,
            end: currentAddress + size - 1,
            size: size,
            type: 'allocated',
            process: processId
        };
        
        processes[processId] = {
            start: currentAddress,
            size: size
        };
        
    
        memoryBlocks[0] = {
            start: newBlock.end + 1,
            end: TOTAL_MEMORY - 1,
            size: TOTAL_MEMORY - newBlock.size,
            type: 'free',
            process: null
        };
        
        memoryBlocks.unshift(newBlock);
        currentAddress += size;
    });
    
    showNotification('Memory compacted successfully', 'success');
    updateMemoryVisualization();
    updateStats();
}

function resetMemory() {
    memoryBlocks = [{ start: 0, end: TOTAL_MEMORY - 1, size: TOTAL_MEMORY, type: 'free', process: null }];
    processes = {};
    
    showNotification('Memory reset to initial state', 'success');
    updateMemoryVisualization();
    updateStats();
}


function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function generateRandomId() {
    const prefix = 'P';
    const randomNumber = Math.floor(Math.random() * 1000);
    const id = `${prefix}${randomNumber}`;
    
    return processes[id] ? generateRandomId() : id;
}


function generateRandomSize() {
    
    return Math.floor(Math.random() * 125) + 4;
}

function startSimulation() {
    if (simulationInterval) {
        return;
    }
    
    document.getElementById('startSimBtn').disabled = true;
    document.getElementById('stopSimBtn').disabled = false;
    
    simulationInterval = setInterval(() => {
       
        const action = Math.random();
        
        if (action < 0.7 || Object.keys(processes).length === 0) {
            const processId = generateRandomId();
            const size = generateRandomSize();
            allocateMemory(processId, size);
        } else {
           
            const processIds = Object.keys(processes);
            const randomIndex = Math.floor(Math.random() * processIds.length);
            const processId = processIds[randomIndex];
            deallocateMemory(processId);
        }
        
     
        if (Math.random() < 0.1) {
            const freeBlocks = memoryBlocks.filter(block => block.type === 'free');
            if (freeBlocks.length > 1) {
                compactMemory();
            }
        }
    }, parseInt(document.getElementById('simSpeed').value));
}

function stopSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        
        document.getElementById('startSimBtn').disabled = false;
        document.getElementById('stopSimBtn').disabled = true;
        
        showNotification('Simulation stopped', 'success');
    }
}


function updateSimulationSpeedDisplay() {
    const speedValue = document.getElementById('simSpeed').value;
    document.getElementById('speedValue').textContent = `${speedValue} ms`;
}
