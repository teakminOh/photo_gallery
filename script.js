const mobileNav = document.querySelector(".hamburger");
const navbar = document.querySelector(".menubar");

const toggleNav = () => {
  navbar.classList.toggle("active");
  mobileNav.classList.toggle("hamburger-active");
};
mobileNav.addEventListener("click", () => toggleNav());

document.addEventListener("DOMContentLoaded", () => {
  const startSlideshowButton = document.getElementById("startSlideshow");
  const stopSlideshowButton = document.getElementById("stopSlideshow");
  const gallery = document.getElementById("gallery");
  const modal = document.getElementById("modal");
  const fullImage = document.getElementById("fullImage");
  const imageTitle = document.getElementById("imageTitle");
  const imageDescription = document.getElementById("imageDescription");
  const imageDateTime = document.getElementById("imageDateTime");
  const mapDiv = document.getElementById("map");
  const closeModalButton = document.getElementById("closeModal");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const showLocationButton = document.getElementById("showLocationButton");
  const filterInput = document.getElementById("filter");

  let photos = [];
  let currentPhotoIndex = 0;
  let slideshowInterval = null;
  let map = null;

  // Load photos from JSON (You can replace this with actual data)
  fetch("photos.json")
    .then((response) => response.json())
    .then((data) => {
      photos = data;
      renderGallery(photos);
    });

  // Render the gallery
  const renderGallery = (photos) => {
    gallery.innerHTML = photos
      .map(
        (photo, index) =>
          `<img class="thumbnail" src="${photo.path}" alt="${photo.title}" data-index="${index}">`
      )
      .join("");
  };

// Define the functions to be used in both add and remove event listeners
const navigatePrevious = () => navigate(-1);
const navigateNext = () => navigate(1);

const initializeMapAndListeners = () => {
  if (map) {
    // Add event listeners for navigation buttons
    prevButton.addEventListener("click", navigatePrevious);
    nextButton.addEventListener("click", navigateNext);
  }
};

// Function to remove event listeners when the map is destroy

const openModal = (index) => {
  
  const photo = photos[index];
  currentPhotoIndex = index;

  fullImage.src = photo.path;
  imageTitle.textContent = photo.title;
  imageDescription.textContent = photo.description;
  imageDateTime.textContent = `Dátum a čas: ${photo.dateTime}`;

  const { latitude, longitude } = photo.coordinates;

  // Hide the image and show the map when "Show Location" is clicked
  fullImage.style.visibility = "visible";  // Make the image visible by default
  mapDiv.style.display = "none";          // Initially hide the map

  // Reset map instance (if it exists) before initializing a new one
  if (map) {
    map.remove();  // Remove the existing map instance
    prevButton.removeEventListener("click", navigatePrevious);
    nextButton.removeEventListener("click", navigateNext);
    map = null;    // Reset the map reference
  }
  
  // Show the "Show Location" button
  showLocationButton.style.display = "block"; // Make the Show Location button visible
  showLocationButton.textContent = "Show Location"; // Set text to "Show Location"

  // Add event listener to the "Show Location" button
  showLocationButton.onclick = () => {
    stopSlideshow();
    // Toggle between showing image and map
    if (mapDiv.style.display === "none") {
      fullImage.style.visibility = "hidden";  // Hide the image
      mapDiv.style.display = "block";         // Display the map over the image
      showLocationButton.textContent = "Show Image";  // Change button text to "Show Image"

      // Dynamically adjust the map size to match the image size
      mapDiv.style.width = fullImage.offsetWidth + "px"; // Set map width equal to image width
      mapDiv.style.height = fullImage.offsetHeight + "px"; // Set map height equal to image height

      // Initialize a new map centered on the coordinates
      map = L.map(mapDiv).setView([latitude, longitude], 13); // Set map to the photo's coordinates

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add a marker at the photo's location
      L.marker([latitude, longitude]).addTo(map)
        .bindPopup(`<strong>${photo.title}</strong><br>${photo.description}`)
        .openPopup();
        
      // Initialize the listeners for map buttons
      initializeMapAndListeners();
    } else {
      
      // Destroy map when switching back to image
      if (map) {
        map.remove(); // Remove the existing map instance
        prevButton.removeEventListener("click", navigatePrevious);
        nextButton.removeEventListener("click", navigateNext);
        map = null;    // Reset the map reference
      }
      
      fullImage.style.visibility = "visible";  // Show the image again
      mapDiv.style.display = "none";           // Hide the map
      showLocationButton.textContent = "Show Location";  // Change button text back to "Show Location"
      
    }
  };
  document.body.style.overflow = "hidden";

  modal.style.display = "flex"; // Show the modal when a thumbnail is clicked
};


  // Close modal
  const closeModal = () => {
    modal.style.display = "none"; // Hide the modal
    if (map) {
      map.remove(); // Remove map if modal is closed
      map = null;    // Reset map reference
    }
    stopSlideshow(); // Stop the slideshow when the modal is closed
    document.body.style.overflow = "auto";

  };

  // Navigate images
  const navigate = (direction) => {
    fullImage.style.visibility = "hidden";
    currentPhotoIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
    
    openModal(currentPhotoIndex);
  };

  // Start the slideshow
  const startSlideshow = () => {
    slideshowInterval = setInterval(() => navigate(1), 3000); // Move to the next image every 3 seconds
    startSlideshowButton.style.display = "none"; // Hide the start button
    stopSlideshowButton.style.display = "inline-block"; // Show the stop button
  };

  // Stop the slideshow
  const stopSlideshow = () => {
    clearInterval(slideshowInterval);
    startSlideshowButton.style.display = "inline-block"; // Show start button
    stopSlideshowButton.style.display = "none"; // Hide stop button
  };

  // Event listeners for buttons
  startSlideshowButton.addEventListener("click", startSlideshow);
  stopSlideshowButton.addEventListener("click", stopSlideshow);
  
  closeModalButton.addEventListener("click", closeModal);

  filterInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filteredPhotos = photos.filter(
      (photo) =>
        photo.title.toLowerCase().includes(query) ||
        photo.description.toLowerCase().includes(query)
    );
    renderGallery(filteredPhotos);
  });
  const handleKeydown = (event) => {
    // Right Arrow (ArrowRight) for next image
    if (event.key === "ArrowRight") {
      navigate(1); // Move to the next image
    }
    
    // Left Arrow (ArrowLeft) for previous image
    if (event.key === "ArrowLeft") {
      navigate(-1); // Move to the previous image
    }
  };

  // Handle click events for the modal to navigate between images
const handleClick = (event) => {
  const modalWidth = modal.offsetWidth;
  const modalHeight = modal.offsetHeight;
  const clickX = event.clientX;
  const clickY = event.clientY;

  // Prevent click event from bubbling to modal when prev or next buttons are clicked
  if (event.target === prevButton || event.target === nextButton) {
    return; // Do nothing if the prev/next button is clicked
  }

  // Define the vertical boundaries of the middle part of the screen
  const middleYStart = modalHeight * 0.25;  // 25% from the top
  const middleYEnd = modalHeight * 0.75;   // 75% from the top

  // Check if the click is within the middle vertical part of the screen (y-axis)
  if (fullImage.style.visibility === "visible" && clickY >= middleYStart && clickY <= middleYEnd) {
    // If the click is on the left half of the screen
    if (clickX < modalWidth / 2) {
      navigate(-1);  // Previous image
    } else {
      navigate(1);   // Next image
    }
  }
};

// Prevent modal's click event from firing when the prev/next buttons are clicked
prevButton.addEventListener("click", (e) => {
  e.stopPropagation(); // Stop click event from bubbling up
  navigatePrevious();
});

nextButton.addEventListener("click", (e) => {
  e.stopPropagation(); // Stop click event from bubbling up
  navigateNext();
});

// Add event listener for modal clicks to navigate
modal.addEventListener("click", handleClick);

  
  let touchStartX = 0;
  let touchStartY = 0;

  const handleTouchStart = (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  };

  const handleTouchEnd = (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Only trigger swipe when the image is visible (not when the map is shown)
    if (fullImage.style.visibility === "visible" && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        navigate(-1); // Previous image (right swipe)
      } else {
        navigate(1);  // Next image (left swipe)
      }
    }
  };


    
  modal.addEventListener("touchstart", handleTouchStart);
  modal.addEventListener("touchend", handleTouchEnd);

  modal.addEventListener("click", handleClick);
  
  document.addEventListener("keydown", handleKeydown);

  gallery.addEventListener("click", (e) => {
    if (e.target.classList.contains("thumbnail")) {
      const index = Number(e.target.dataset.index);
      openModal(index); // Open the modal when an image is clicked
    }
  });
});


// s