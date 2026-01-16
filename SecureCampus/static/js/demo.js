

var searchBar = document.getElementById('search-bar');
var filterIcon = document.querySelector('.filter-icon');

window.onload = function () {
  window.setTimeout(fadeout, 500);
};

function fadeout() {
  document.querySelector(".preloader").style.opacity = "0";
  document.querySelector(".preloader").style.display = "none";
}

searchBar.addEventListener('input', function() {
  if (searchBar.value !== '' || document.activeElement === searchBar) {
    filterIcon.style.display = 'none';
  } else {
    filterIcon.style.display = 'block';
  }
});

searchBar.addEventListener('focus', function() {
    filterIcon.style.display = 'none';
  });

  searchBar.addEventListener('blur', function() {
    if (searchBar.value === '') {
      filterIcon.style.display = 'block';
    }
  });

    function Search() {
        // Declare variables
        var input, filter, table, tr, td1, td2, i, txtValue1, txtValue2;
        input = document.getElementById('search-bar');
        filter = input.value.toUpperCase();
        table = document.getElementById('LogTable');
        tr = table.getElementsByTagName('tr');
    
        // Loop through all table rows, and hide those who don't match the search query
        for (i = 0; i < tr.length; i++) {
            td1 = tr[i].getElementsByTagName('td')[1]; // Get the first column
            td2 = tr[i].getElementsByTagName('td')[2]; // Get the second column
    
            if (td1 && td2) {
                txtValue1 = td1.textContent || td1.innerText;
                txtValue2 = td2.textContent || td2.innerText;
    
                if (txtValue1.toUpperCase().indexOf(filter) > -1 || txtValue2.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }

    let detectionOn = false;
const videoElement = document.getElementById('video');
const toggleButton = document.getElementById('toggle-detection');

function startStream(url) {
    // Pause the video element before changing the source
    //videoElement.pause();
    videoElement.src = url;
    videoElement.load();
    videoElement.play();
}

toggleButton.addEventListener('click', () => {
    detectionOn = !detectionOn;
    if (!detectionOn) {
      toggleButton.style.background = '-webkit-gradient(linear, left top, right top, from(#33c8c1), color-stop(50%, #119bd2), to(#33c8c1))';
      toggleButton.background = 'linear-gradient(to right, #33c8c1 0%, #119bd2 50%, #33c8c1 100%)';
      startStream('/video_feed');
    } else {  
      toggleButton.style.background = '-webkit-gradient(linear, left top, right top, from(#c83333), color-stop(50%, #d21111), to(#c83333))';
      toggleButton.background = 'linear-gradient(to right, #c83333 0%, #d21111 50%, #c83333 100%)';
      startStream('/video_feed_with_detection');
    }
});

// Start the normal camera feed by default
startStream('/video_feed');

