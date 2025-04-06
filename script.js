
// Js file for memmory allocation done by Deepak harish


class MemoryManager {

  constructor(totalMemory = 1024 * 1024, minAllocation = 4 * 1024) {

      this.totalMemory = totalMemory;

      this.minAllocation = minAllocation;

      this.blocks = [{
          start: 0,
          size: totalMemory,
          processId: null,
          isFree: true
      }];
      
  }

  allocate(processId, size, method) {


      size = Math.max(size, this.minAllocation);
      size = Math.ceil(size / this.minAllocation) * this.minAllocation;

      const blockIndex = method === 'first-fit' 

          ? this.findFirstFit(size)
          : this.findBestFit(size);

      if (blockIndex === -1) return false;

      const block = this.blocks[blockIndex];

      if (block.size === size) {
          block.isFree = false;
          block.processId = processId;
      } else {
          const newBlock = {
              start: block.start,
              size: size,
              processId: processId,
              isFree: false
          };
          
          block.start += size;
          block.size -= size;
          
          this.blocks.splice(blockIndex, 0, newBlock);
      }

      this.updateUI();
      return true;

  }

  deallocate(processId) {
      const blockIndex = this.blocks.findIndex(b => b.processId === processId);
      if (blockIndex === -1) return false;

      this.blocks[blockIndex].isFree = true;
      this.blocks[blockIndex].processId = null;
      
      this.coalesce();
      this.updateUI();
      return true;
  }

  findFirstFit(size) {
      return this.blocks.findIndex(block => block.isFree && block.size >= size);
  }

  findBestFit(size) {
      let bestFitIndex = -1;
      let smallestDifference = Infinity;

      this.blocks.forEach((block, index) => {
          if (block.isFree && block.size >= size) {
              const difference = block.size - size;
              if (difference < smallestDifference) {
                  smallestDifference = difference;
                  bestFitIndex = index;
              }
          }
      });

      return bestFitIndex;
  }

  coalesce() {
      for (let i = 0; i < this.blocks.length - 1; i++) {
          if (this.blocks[i].isFree && this.blocks[i + 1].isFree) {
              this.blocks[i].size += this.blocks[i + 1].size;
              this.blocks.splice(i + 1, 1);
              i--;
          }
      }
  }

  getStats() {
      const totalFreeMemory = this.blocks.reduce(
          (sum, block) => sum + (block.isFree ? block.size : 0),
          0
      );

      const fragmentCount = this.blocks.reduce(
          (count, block) => count + (block.isFree ? 1 : 0),
          0
      );

      return {
          totalMemory: this.totalMemory,
          freeMemory: totalFreeMemory,
          usedMemory: this.totalMemory - totalFreeMemory,
          fragmentCount,
          utilization: ((this.totalMemory - totalFreeMemory) / this.totalMemory) * 100
      };
  }

  updateUI() {

      const memoryBlocks = document.getElementById('memoryBlocks');
      const stats = this.getStats();

      memoryBlocks.innerHTML = '';

      this.blocks.forEach(block => {
          const blockElement = document.createElement('div');
          blockElement.className = `block ${block.isFree ? 'free' : 'allocated'}`;
          blockElement.style.width = `${(block.size / this.totalMemory) * 100}%`;

          if (!block.isFree && block.processId) {
              const info = document.createElement('div');
              info.className = 'block-info';
              info.innerHTML = `${block.processId} <button onclick="memoryManager.deallocate('${block.processId}')">×</button>`;
              blockElement.appendChild(info);
          }

          memoryBlocks.appendChild(blockElement);
      });

      document.getElementById('memoryUsage').textContent = `${Math.round(stats.utilization)}%`;
      document.getElementById('freeMemory').textContent = `${Math.round(stats.freeMemory / 1024)} KB`;
      document.getElementById('fragments').textContent = stats.fragmentCount;
  }
}

const memoryManager = new MemoryManager();

memoryManager.updateUI();

function allocateMemory() {

  const processId = document.getElementById('processId').value;
  const size = parseInt(document.getElementById('size').value) * 1024; 

  const algorithm = document.getElementById('algorithm').value;

  if (!processId || !size) {
      alert('Please fill in all fields');
      return;
  }

  if (size < memoryManager.minAllocation) {
      alert('Size must be at least 4KB');
      return;
  }

  const success = memoryManager.allocate(processId, size, algorithm);
  if (!success) {
      alert('Not enough memory');
      return;
  }

  document.getElementById('processId').value = '';

  document.getElementById('size').value = '';

}