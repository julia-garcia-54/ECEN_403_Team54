// List of MODEL IDs (extra for map)
const modelIds = ['001', '002', '003', '004', '005'];

//this generates model ID blocks 
const modelList = document.getElementById('model-list');

//creates block for each model id
modelIds.forEach(id => {
  const block = document.createElement('div');
  block.classList.add('model-block'); //adds 'model-block' class (will be used in css)
  block.textContent = `MODEL ${id}`; //block will have texts that show the ID
  block.setAttribute('data-id', id); //block will also store model ID data
  block.setAttribute('data-location', 'model-list'); // Track location of block
  modelList.appendChild(block); //add block to modei-id list container
});

// Variables to track dragging (start at (0,0))
let isDragging = false; // this boolean flag shows if 'drag' operation is currently being used
let dragStartX = 0; //starting x position
let dragStartY = 0;//starting y position

// Enable dragging for 'model blocks' class element (this uses interact.js)
interact('.model-block')
  .draggable({
    inertia: true, //inertia helps for smoother dragging
    autoScroll: true, //when drag blocks near edge of screen--> screen starts scroll

    //this function is called when block starts dragged
    onstart: function (event) {
      isDragging = false; // Reset flag at the start
      //record starting x,y 
      dragStartX = event.clientX;
      dragStartY = event.clientY;

      const target = event.target; //this is whats being dragged

      // Set position to absolute and zIndex to ensure proper dragging
      //this ensures that current block being dragged appears above all other elements
      target.style.position = 'absolute';
      target.style.zIndex = '1000';
    },

    //function called during dragging
    onmove: function (event) {
      //distance moved since starting
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); //pythagorean theorem to find distance c

      //only if distance is above 5pixels --> isdragging= true
      if (distance > 5) {
        isDragging = true; // Set flag to true if movement exceeds threshold
      }

      dragMoveListener(event); //updates blocks position
    },
    //function called when dragging ends
    onend: function (event) {
      const target = event.target;
      // reset zIndex after dragging
      target.style.zIndex = '';

      // delays resetting of isDragging (runs after call stack is cleared)
      //makes sure other events (like click) happen before isdragging is set to false
      setTimeout(() => {
        isDragging = false;
      }, 0);

      saveLayout(); //save layout to local storage
    },
  });

// Map area and model list as dropzones
interact('#map-area, #model-list').dropzone({
  accept: '.model-block', //onyl accepts elements called'model-block'
  overlap: 0.75, //must be atleast 75% in map area to be a valid drop(not sure if this works)

  //function called when good element is dropped into map area
  ondrop: function (event) {
    const block = event.relatedTarget; //block element being dropped
    const dropzone = event.target;// dropzone element

    //check if blocks parent is not dropzone (checking if its dropped into a dif container)
    if (block.parentElement !== dropzone) {

      //position of block relative to screen
      const blockRect = block.getBoundingClientRect();
      // position of dropzone relative to screen
      const dropzoneRect = dropzone.getBoundingClientRect();

      //x,y position relative to dropzone
      const x = blockRect.left - dropzoneRect.left;
      const y = blockRect.top - dropzoneRect.top;

      // Removefrom current parent --> to dropzones
      block.parentElement.removeChild(block); //remove from current container
      dropzone.appendChild(block);//add to dropzone container

      // update block location attribute
      if (dropzone.id === 'map-area') { //if block is dropped in map area
        block.setAttribute('data-location', 'map-area');

        // new position within map area
        block.style.transform = `translate(${x}px, ${y}px)`; //translate moves element by x and y
        block.setAttribute('data-x', x);
        block.setAttribute('data-y', y);
      } else { //or if block is moved back to model list
        block.setAttribute('data-location', 'model-list');

        //when blocks returned to model list -->reset block position (not sure if this works properly)
        block.style.transform = '';
        block.removeAttribute('data-x');
        block.removeAttribute('data-y');
      }
    }
  },
});

// moves block during dragging
function dragMoveListener(event) {
  const target = event.target; //current element being dragged

  //get current position form either data attributes or make 0
  const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
  const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

  //update position of block ussing CSS transform
  target.style.transform = `translate(${x}px, ${y}px)`;
  //update data attributes w new x,y
  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);
}

// Back Button Functionality
const backButton = document.getElementById('back-button');
//when button is clicked -->overview page
backButton.addEventListener('click', () => {
  window.location.href = 'overview_page.html';
});

// Reset Button Functionality
const resetButton = document.getElementById('reset-button');
//when resert button is clicked, popup asking for confirmation
resetButton.addEventListener('click', () => {
  const confirmReset = confirm('Are you sure you want to reset the map?');
  if (confirmReset) {
    resetMap(); //if they confrim yes --> map is reset
  }
});

//function to reset map
function resetMap() {
  // remove saved layout from local storage
  localStorage.removeItem('mapLayout');

  // this gets refrences for map area + model list containers
  const mapArea = document.getElementById('map-area');
  const modelList = document.getElementById('model-list');

  //this finds all blocks that are in map area
  const blocksInMapArea = mapArea.querySelectorAll('.model-block');
  //for all blocks in map area, remove them
  blocksInMapArea.forEach(block => {
    //remove blocks from map area +clear data
    mapArea.removeChild(block);
    //resets position
    block.style.transform = ''; //remove any transformations
    block.removeAttribute('data-x');//remove stored x value
    block.removeAttribute('data-y');//remove stored y value
    block.style.position = 'relative'; //make position default
    block.style.zIndex = ''; //make zindex default
    block.setAttribute('data-location', 'model-list'); //update blocks location to show its back in model list (from the map area)
    //put block back in model list container
    modelList.appendChild(block);
  });
}

// function to save layout to local storage
function saveLayout() {
  const mapArea = document.getElementById('map-area');
  const blocks = mapArea.querySelectorAll('.model-block'); //all blocks in map area
  const layout = []; //empty array to hold data for layout

  blocks.forEach(block => {
    const id = block.getAttribute('data-id'); //MODELIDs
    const x = block.getAttribute('data-x') || 0; //x position
    const y = block.getAttribute('data-y') || 0; //y position

    layout.push({ id, x, y }); //add data to layout array
  });

  //layout array --> JSON string -->save to local storage
  localStorage.setItem('mapLayout', JSON.stringify(layout));
}

//function to load layout from local storage
function loadLayout() {
  const layout = JSON.parse(localStorage.getItem('mapLayout')); // get layout array data from local storage parse through it
  const mapArea = document.getElementById('map-area'); //get map area elements from html
  const modelList = document.getElementById('model-list');//get model list elements from html

  // Move all blocks back to the model list
  const allBlocks = document.querySelectorAll('.model-block'); //selects elemtns w/ class 'model-block'
  allBlocks.forEach(block => {
    block.parentElement.removeChild(block); //remove block from current parent

    //reset blocks attributes
    block.style.transform = ''; //clear transformations
    block.removeAttribute('data-x'); //remove x values
    block.removeAttribute('data-y');//remove y values
    block.style.position = 'relative';//absolte --> relative
    block.style.zIndex = '';//1000--> default
    block.setAttribute('data-location', 'model-list'); //update location of block to mdoel list
    modelList.appendChild(block); //add block to model list
  });

  //if theres already saved layout (from switches pages), remake it
  if (layout) {
    //for each block's data
    layout.forEach(item => {
      // Find the block element correspoding to the MODEL ID
      const block = document.querySelector(`.model-block[data-id="${item.id}"]`);

      //if it exist
      if (block) {
        //place blocks into map area
        modelList.removeChild(block); //remove from model list
        mapArea.appendChild(block); //add to map area

        // Set position saved from earlier
        block.style.position = 'absolute'; //absolute (to allow for moving around in map area)
        block.style.transform = `translate(${item.x}px, ${item.y}px)`; //position block using saved coordiantes
        block.setAttribute('data-x', item.x); //stored x value
        block.setAttribute('data-y', item.y);//stored y value
        block.style.zIndex = ''; //reset z index
        block.setAttribute('data-location', 'map-area'); //update location of block to 'map area'
      }
    });
  }
}

// when page loads, load layout
window.addEventListener('load', loadLayout);

//event listener for click to go to video page
document.addEventListener('click', function (event) {
  //if isDragging is false --> then its a click
  //this prevents from directing to video page while just dragging (requires user to click on block while its stationary)
  if (
    event.target.classList.contains('model-block') &&
    !isDragging
  ) {
    const videoId = event.target.getAttribute('data-id'); //get model id from blocks attributes
    navigateToVideoPage(videoId); //navigate to that specific video id
  }
});

//navigates to video page of selected model ID
function navigateToVideoPage(videoId) {
  window.location.href = `video_page.html?videoId=${encodeURIComponent(videoId)}`;//directs user to video page. MODEL ID as URL
}
