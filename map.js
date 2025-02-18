const mobileNav = document.querySelector(".hamburger");
const navbar = document.querySelector(".menubar");

const toggleNav = () => {
  navbar.classList.toggle("active");
  mobileNav.classList.toggle("hamburger-active");
};
mobileNav.addEventListener("click", () => toggleNav());

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const fullImage = document.getElementById("fullImage");
  const imageTitle = document.getElementById("imageTitle");
  const imageDescription = document.getElementById("imageDescription");
  const imageDateTime = document.getElementById("imageDateTime");
  const galleryModal = document.getElementById("galleryModal");
  const galleryContainer = document.getElementById("gallery");
  const closeModalButton = document.getElementById("closeModal");
  const startSlideshowButton = document.getElementById("startSlideshow");
  const stopSlideshowButton = document.getElementById("stopSlideshow");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");

  
  let photos = [];
  let currentPhotoIndex = 0;
  let slideshowInterval = null;

  // Initialize map
  const map = L.map("photoMap").setView([25, 0], 3); // Default center (Bratislava)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // Load photos from JSON
  fetch("photos.json")
    .then((response) => response.json())
    .then((data) => {
      photos = data;

      // Add markers to the map
      photos.forEach((photo, index) => {
        const { title, description, coordinates } = photo;
        const { latitude, longitude } = coordinates;

        const marker = L.marker([latitude, longitude]).addTo(map);

        marker.on("click", () => {
          const locationPhotos = photos.filter(
            (p) =>
              p.coordinates.latitude === latitude &&
              p.coordinates.longitude === longitude
          );

          if (locationPhotos.length === 1) {
            openModal(photos.indexOf(locationPhotos[0])); // Pass index of the photo
          } else {
            openGalleryModal(locationPhotos);
          }
        });

        marker.on("mouseover", function () {
          marker.bindPopup(
            `<strong>${photo.title}</strong><br>${photo.description}`
          ).openPopup();
        });
        
      });
    })
    .catch((error) => console.error("Error loading photo data:", error));

    let isGalleryModalOpen = false; // Flag to track gallery modal state


    let currentGalleryPhotos = []; // Filtered photos for the current gallery

    // Open gallery modal
    const openGalleryModal = (filteredPhotos) => {
      currentGalleryPhotos = filteredPhotos; // Store the filtered photos
      galleryContainer.innerHTML = ""; // Clear existing thumbnails

      filteredPhotos.forEach((photo) => {
        const thumbnail = document.createElement("img");
        thumbnail.src = photo.path || "";
        thumbnail.alt = photo.title || "No title";
        thumbnail.classList.add("thumbnail");

        // Add click event to open the photo in the main modal
        thumbnail.addEventListener("click", () => {
          const index = filteredPhotos.indexOf(photo); // Find index in the filtered array
          openModal(index, true); // Open photo modal with gallery context
        });

        galleryContainer.appendChild(thumbnail);
      });

      galleryModal.style.display = "flex";
      modal.style.display = "none"; // Hide photo modal
      
      document.body.style.overflow = "hidden"; // Prevent scrolling
    };

    // Open photo modal
    const openModal = (index, isFromGallery = false) => {
      const photo = isFromGallery ? currentGalleryPhotos[index] : photos[index];
      if (!photo) {
        console.error("Invalid photo index:", index);
        return;
      }

      currentPhotoIndex = index;

      fullImage.src = photo.path;
      imageTitle.textContent = photo.title;
      imageDescription.textContent = photo.description;
      imageDateTime.textContent = `Dátum a čas: ${photo.dateTime}`;

      modal.style.display = "flex";
      galleryModal.style.display = "none"; // Hide gallery modal if open
      document.body.style.overflow = "hidden"; // Prevent scrolling
    };

    
    const navigate = (direction) => {
      const currentPhotos = currentGalleryPhotos.length > 0 ? currentGalleryPhotos : photos; // Use gallery photos if available
      currentPhotoIndex =
        (currentPhotoIndex + direction + currentPhotos.length) % currentPhotos.length;
    
      openModal(currentPhotoIndex, currentGalleryPhotos.length > 0);
    };
    
    // Close photo modal
    const closeModal = () => {
      stopSlideshow();
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    
      if (currentGalleryPhotos.length > 0) {
        // Reopen the gallery modal if it was previously open
        galleryModal.style.display = "flex";
      }
    };
    
    // Close gallery modal
    const closeGalleryModal = () => {
      galleryModal.style.display = "none";
      currentGalleryPhotos = []; // Clear the gallery context
      document.body.style.overflow = "auto"; // Re-enable scrolling
    };
    
    // Event listener for the gallery modal close button
    const closeGalleryModalButton = document.getElementById("closeGalleryModal");
    closeGalleryModalButton.addEventListener("click", closeGalleryModal);
    
    // Event listener for the photo modal close button
    closeModalButton.addEventListener("click", closeModal);
    


  // Slideshow controls
  const startSlideshow = () => {
    slideshowInterval = setInterval(() => navigate(1), 3000);
    startSlideshowButton.style.display = "none";
    stopSlideshowButton.style.display = "inline-block";
  };

  const stopSlideshow = () => {
    clearInterval(slideshowInterval);
    startSlideshowButton.style.display = "inline-block";
    stopSlideshowButton.style.display = "none";
  };


  // Event listeners
  closeModalButton.addEventListener("click", closeModal);
  startSlideshowButton.addEventListener("click", startSlideshow);
  stopSlideshowButton.addEventListener("click", stopSlideshow);
  prevButton.addEventListener("click", () => navigate(-1));
  nextButton.addEventListener("click", () => navigate(1));

  const toggleRouteButton = document.getElementById("toggleRoute");
  let routeLayer = null; // Store the route control instance
  let routeVisible = false; // Track the visibility of the route
  
  // Function to toggle the route display
  const toggleRoute = () => {
      const routeDistanceElement = document.getElementById("routeDistance");
  
      if (routeVisible) {
          // If the route is visible, remove it
          if (routeLayer) {
              try {
                  map.removeControl(routeLayer); // Properly remove the control
                  routeLayer = null; // Clear the route layer reference
              } catch (error) {
                  console.error("Error removing route layer:", error);
              }
          }
          routeVisible = false;
          toggleRouteButton.textContent = "Zobraziť trasu"; // Change button text
          routeDistanceElement.textContent = ""; // Clear the distance display
      } else {
          // If the route is not visible, display it
          showRoute();
          routeVisible = true;
          toggleRouteButton.textContent = "Skryť trasu"; // Change button text
      }
  };
  
  // Function to display the route
  const showRoute = () => {
      if (!photos || photos.length === 0) {
          console.error("No photos available to create a route.");
          return;
      }
  
      // Sort photos globally by date
      const sortedPhotos = [...photos].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
  
      // Extract coordinates
      const coordinates = sortedPhotos.map(photo =>
          L.latLng(photo.coordinates.latitude, photo.coordinates.longitude)
      );
  
      // Create the route using Leaflet Routing Machine
      routeLayer = L.Routing.control({
          waypoints: coordinates,
          routeWhileDragging: true,
          show: false, // Hide the default control panel
          addWaypoints: false, // Prevent modifying waypoints
          createMarker: () => null, // No markers
          fitSelectedRoutes: false, // Disable auto-zoom
      }).addTo(map);
  
      // Listen for the route calculation event
      routeLayer.on('routesfound', function (e) {
          const route = e.routes[0];
          const totalDistance = (route.summary.totalDistance / 1000).toFixed(2); // Convert meters to kilometers
          const routeDistanceElement = document.getElementById("routeDistance");
          routeDistanceElement.textContent = `Celková dĺžka trasy: ${totalDistance} km`;
      });
  
      // Catch errors during route calculation
      routeLayer.on('routingerror', function (error) {
          console.error("Error calculating route:", error);
      });
  };
  

  

  // Add event listener for the toggle button
  toggleRouteButton.addEventListener("click", toggleRoute);

  // Haversine formula to calculate distance between two lat-lng points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const toRadians = (deg) => (deg * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  };

  // Function to calculate the total route distance
  const calculateTotalDistance = (coordinates) => {
    let totalDistance = 0;

    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1];
      const [lat2, lon2] = coordinates[i];
      totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
    }

    return totalDistance.toFixed(2); // Return distance rounded to 2 decimal places
  };

});


