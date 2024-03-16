let grid = [];
let startCell = null;
let targetCells = [];
let blockedCells = [];
let maxTargets = 1; // Default to 1 target
let heuristic = 'manhattan';
function getNeighbors(node) {
    const neighbors = [];
    const directions = [
        { row: -1, col: 0 }, // Top
        { row: 1, col: 0 },  // Bottom
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 },  // Right
    ];
    for (const direction of directions) {
        const newRow = node.row + direction.row;
        const newCol = node.col + direction.col;

        // Check if the new position is within the grid boundaries
        if (newRow >= 0 && newRow < grid.length && newCol >= 0 && newCol < grid[0].length) {
            // Check if the new position is not a blocked cell
            if (!blockedCells.some(blocked => blocked.row === newRow && blocked.col === newCol)) {
                neighbors.push(createNode({ row: newRow, col: newCol }));
            }
        }
    }

    return neighbors;
}
function createNode(cell) {
    return {
        row: cell.row,
        col: cell.col,
        g: 0,
        h: 0,
        f: 0,
        parent: null,
    };
}
function generateGrid() {
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);

    grid = Array.from({ length: height }, () => Array(width).fill(0));

    startCell = null;
    targetCells = [];
    blockedCells = [];
    const element = document.getElementById('grid-container');
    element.style.gridTemplateColumns = 'repeat(' + height + ', 30px)';
    
    renderGrid();
}
function renderGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.innerHTML = ''; // Clear existing grid
    const fragment = document.createDocumentFragment(); // Use a DocumentFragment to minimize reflows
    for (let i = 0; i < grid.length; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row'; // Assuming you have CSS for .grid-row for proper row layout
        for (let j = 0; j < grid[i].length; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            setCellState(cell, i, j); // Function to set the cell's class based on its state
            cell.addEventListener('click', () => toggleCell(i, j));
            row.appendChild(cell);
        }
        fragment.appendChild(row);
    }
    gridContainer.appendChild(fragment); // Append all at once
}
function setCellState(cell, i, j) {
    if (startCell && i === startCell.row && j === startCell.col) {
        cell.classList.add('start');
    } else if (blockedCells.some(blocked => blocked.row === i && blocked.col === j)) {
        cell.classList.add('blocked');
    } else {
        cell.classList.remove('start', 'target', 'blocked'); // Remove states for reusable cells
    }
    const targetIndex = targetCells.findIndex(target => target.row === i && target.col === j);
    if (targetIndex !== -1) {
        cell.classList.add(`target${targetIndex + 1}`); // Add class 'target1' or 'target2'
    } else {
        // Remove target classes if the cell is no longer a target
        cell.classList.remove('target1', 'target2');
    }
}
function updateTargetCount() {
    const targetCount = parseInt(document.getElementById('targetCount').value, 10);
    maxTargets = targetCount;
    targetCells = [];
    renderGrid();
}
function toggleCell(row, col) {
    const cellIndex = blockedCells.findIndex(blocked => blocked.row === row && blocked.col === col);
    if (!startCell) {
        startCell = { row, col };
    } else if (targetCells.length < maxTargets && !targetCells.some(target => target.row === row && target.col === col)) {
        targetCells.push({ row, col });
    } else if (startCell && startCell.row === row && startCell.col === col) {
        // Allow clearing the start cell if clicked again
        startCell = null;
    } else {
        const existingTargetIndex = targetCells.findIndex(target => target.row === row && target.col === col);
        if (existingTargetIndex !== -1) {
            targetCells.splice(existingTargetIndex, 1);
        } else {
            const isBlocked = blockedCells.some(blocked => blocked.row === row && blocked.col === col);
            if (isBlocked) {
                blockedCells = blockedCells.filter(blocked => blocked.row !== row || blocked.col !== col);
            } else {
                blockedCells.push({ row, col });
            }
        }
    }
    renderGrid();
}

function solvePath() {
        if (!startCell || targetCells.length === 0) {
            alert('Please set start and target cells.');
            return;
        }
        const path = aStarAlgorithm();
        if (path) {
            displayPath(path);
             // Number of steps is the length of the path minus 1 -- we count from start -> goal -1
            const steps = path.length - 1;
            const testedNodes = Object.keys(closedSet).length;
            alert(`Goal Reached SUCCESSFULLY! \nSteps: ${steps}\nTested Nodes: ${testedNodes}`);
        } else {
            alert('No path found.');
        }
    }
    function displayPath(path) {
        for (const step of path) {
            const cell = document.querySelector(`.cell[data-row="${step.row}"][data-col="${step.col}"]`);
            if (cell) {
                cell.classList.add('path');
            }
        }
    }
    function aStarAlgorithm() {
        const openSet = [];
        closedSet = {};

        const startNode = createNode(startCell);
        const targetNodes = targetCells.map(targetCell => createNode(targetCell));

        startNode.g = 0;
        startNode.h = calculateHeuristic(startNode, targetNodes);
        startNode.f = startNode.g + startNode.h;

        openSet.push(startNode);

        while (openSet.length > 0) {
            const currentNode = getLowestFNode(openSet);

            if (targetNodes.some(targetNode => currentNode.row === targetNode.row && currentNode.col === targetNode.col)) {
                return reconstructPath(currentNode);
            }

            openSet.splice(openSet.indexOf(currentNode), 1);
            closedSet[getNodeKey(currentNode)] = currentNode;

            const neighbors = getNeighbors(currentNode);

            for (const neighbor of neighbors) {
                if (closedSet[getNodeKey(neighbor)]) {
                    continue;
                }

                const tentativeG = currentNode.g + 1;

                if (!openSet.includes(neighbor) || tentativeG < neighbor.g) {
                    neighbor.g = tentativeG;
                    neighbor.h = calculateHeuristic(neighbor, targetNodes);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = currentNode;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null; // No path found
    }

    function getLowestFNode(nodes) {
        return nodes.reduce((lowest, node) => (node.f < lowest.f ? node : lowest), nodes[0]);
    }
    function calculateHeuristic(node, targets) {
        if (heuristic === 'manhattan') {
            const distances = targets.map(target => Math.abs(node.row - target.row) + Math.abs(node.col - target.col));
            return Math.min(...distances);
        } else if (heuristic === 'euclidean') {
            const distances = targets.map(target => Math.sqrt((node.row - target.row) ** 2 + (node.col - target.col) ** 2));
            return Math.min(...distances);
        }
    }
    function reconstructPath(node) {
        const path = [];
        let currentNode = node;
    
        while (currentNode) {
            path.push({ row: currentNode.row, col: currentNode.col });
            currentNode = currentNode.parent;
        }

        return path.reverse();
    }
    function getNodeKey(node) {
        return `${node.row}-${node.col}`;
    }
    

