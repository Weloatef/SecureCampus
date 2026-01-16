var searchBar = document.getElementById('search-bar');
var filterIcon = document.querySelector('.filter-icon');

window.onload = function() {
  loadUsers();
};

function displayUserInfo(user) {
  let mainContainer = document.querySelector('.container');
  mainContainer.innerHTML = '';

  let gridContainer = document.createElement('div');
  gridContainer.className = 'grid-container';

  // Create grid items for each piece of user info
  let imageGridItem = document.createElement('div');
  imageGridItem.className = 'grid-item';

  let imageInfoParagraph = document.createElement('p');
  imageInfoParagraph.className = 'person-info';
  imageInfoParagraph.innerHTML = 'User Image<br><div class="person-adInfo"><img src="' + user.Picture + '" alt="Person" class="person-image"></div>';

  imageGridItem.appendChild(imageInfoParagraph);
  gridContainer.appendChild(imageGridItem);

  let infoFields = ['FirstName', 'SecondName', 'Email', 'PhoneNumber', 'Admin', 'LastSignIn', 'LastSignOut'];
  for (let field of infoFields) {
    let gridItem = document.createElement('div');
    gridItem.className = 'grid-item';

    let infoParagraph = document.createElement('p');
    infoParagraph.className = 'person-info';

    // Directly use the value from the database
    let fieldValue = user[field];
    infoParagraph.innerHTML = field + '<br><div class="person-adInfo">' + fieldValue + '</div>';

    gridItem.appendChild(infoParagraph);
    gridContainer.appendChild(gridItem);
  }



  mainContainer.appendChild(gridContainer);

  let reportContainer = document.createElement('div');
  reportContainer.className = 'container-report';

  let uidParagraph = document.createElement('p');
  uidParagraph.className = 'person-info';
  uidParagraph.innerHTML = 'User UID<br><div class="person-adInfo username">' + user.id + '</div>';
  reportContainer.appendChild(uidParagraph);

  // Create buttons for Edit, Delete, and Add User
  let buttonIds = ['EditUser', 'DeleteUser', 'AddUser'];
  let buttonActions = ['editUser', 'deleteUser', 'addUser'];
  let buttonClasses = ['main-btn-a', 'main-btn-d', 'main-btn'];
  let buttonTexts = ['Edit User', 'Delete User', 'Add User'];
  for (let i = 0; i < buttonIds.length; i++) {
    let button = document.createElement('button');
    button.id = buttonIds[i];
    button.className = buttonClasses[i];
    button.innerText = buttonTexts[i];
    if (buttonActions[i] === 'addUser') {
      button.onclick = function() {
        window[buttonActions[i]]();
      };
    } else {
      button.onclick = function() {
        window[buttonActions[i]](user.id,user);
      };
    }
    reportContainer.appendChild(button);
  }

  mainContainer.appendChild(reportContainer);
}

function fadeout() {
  document.querySelector(".preloader").style.opacity = "0";
  document.querySelector(".preloader").style.display = "none";
}

function editUser(uid,userInfo) {

  if (userInfo.Admin === true || userInfo.Admin === 'true') {
    alert("The Admins Information Can't be Edited");
    return; // Exit the function early
  }

  console.log(userInfo);

let mainContainer = document.querySelector('.container');
mainContainer.innerHTML = ''; // Clear the existing content

mainContainer.innerHTML = `
    
      <div class="grid-container">
      <div class="grid-item user-image" style="width: 100%;">  
      <p class="person-info">User Image<br>
      <div class="person-adInfo" style="display: flex; flex-direction: row;align-items: center;">
        <input type="file" accept="image/*" id="imageUpload" style="display: none;">
        <label for="imageUpload" class="main-btn-a" style="font-size: 10pt; width: 50%; height: 50px;">Choose Image</label>
        <div id="imagePreviewContainer" style="flex-grow: 1;"></div> <!-- Container for the image preview -->
      </div></p>
      </div>
      <div class="grid-item">
        <p class="person-info">First Name<br><div class="person-adInfo"><input type="text" id="FirstName" placeholder="First Name" class="form-control"></div></p>
      </div>
      <div class="grid-item">
        <p class="person-info">Second Name<br><div class="person-adInfo"><input type="text" id="SecondName" placeholder="Second Name" class="form-control"> </div></p>
      </div>
      <div class="grid-item">
        <p class="person-info">Email<br><div class="person-adInfo"><input type="email" id="Email" placeholder="Email" class="form-control"> </div></p>
      </div>
      <div class="grid-item">  
        <p class="person-info">Phone Number<br><div class="person-adInfo"><input type="text" id="phoneNumber" placeholder="Phone Number" class="form-control"></div></p>
      </div>
      <div class="grid-item">
        <p class="person-info">Admin<br><div class="person-adInfo"><input type="checkbox" id="isAdmin"></div></p>
      </div>
      <div class="grid-item">
        <p id="AlertMsg1" class="person-info" style="color:red; font-size: 14pt;"><div class="person-adInfo" id="AlertMsg2" style="color:red; font-size: 14pt;"></div></p>
      </div>
      </div>
      <div class="container-report">
          <button class="main-btn-d" id="CancelButtonEdit">Cancel</button>
          <button class="main-btn" id="SaveButtonEdit">Save</button>
      </div>
`;

document.getElementById('FirstName').value = userInfo.FirstName;
document.getElementById('SecondName').value = userInfo.SecondName;
document.getElementById('Email').value = userInfo.Email;
document.getElementById('phoneNumber').value = userInfo.PhoneNumber;

// For the checkbox, determine if the user is an admin. Works with both 'true' (string) or true (boolean) as values.
document.getElementById('isAdmin').checked = userInfo.Admin === true;

// Display image in the imagePreviewContainer
let img = document.createElement('img');
img.src = userInfo.Picture;
let imagePreviewContainer = document.getElementById('imagePreviewContainer');
imagePreviewContainer.innerHTML = ''; // Clear any existing images
imagePreviewContainer.appendChild(img);

let customUploadBtn = document.getElementById('imageUpload');

// Trigger file input when the custom button is clicked
customUploadBtn.addEventListener('click', function() {
  document.getElementById('imageUpload').click();
});

document.getElementById('imageUpload').addEventListener('change', function handleImageUpload() {
  if (this.files && this.files[0]) {
    let img = document.createElement('img');
    img.src = URL.createObjectURL(this.files[0]);
    img.onload = function() {
      URL.revokeObjectURL(img.src); // Free up memory by revoking object URL
    };

      // Adjust to append the image next to the label
      let imagePreviewContainer = document.getElementById('imagePreviewContainer');
      imagePreviewContainer.innerHTML = ''; // Clear any existing images
      imagePreviewContainer.appendChild(img);
  }
});

document.getElementById('CancelButtonEdit').addEventListener('click', function() {
  fetch('/get_user_data/' + uid)
    .then(response => response.json())
    .then(data => {
      // Assuming displayUserInfo is defined and accessible
      data.id = uid; // Append uid to data as data.id
      displayUserInfo(data);
    })
    .catch(error => console.error('Error fetching user data:', error));
});

document.getElementById('SaveButtonEdit').addEventListener('click', function() {
    let email = document.getElementById('Email').value;
    let firstName = document.getElementById('FirstName').value;
    let secondName = document.getElementById('SecondName').value;
    let phoneNumber = document.getElementById('phoneNumber').value;
    let isAdmin = document.getElementById('isAdmin').checked;
    let fileInput = document.getElementById('imageUpload');
    let AlertMsg1 = document.getElementById('AlertMsg1');
    let AlertMsg2 = document.getElementById('AlertMsg2');

    // Check if any input is left empty (excluding password for edit)
    if (!email || !firstName || !secondName || !phoneNumber) {
        AlertMsg1.textContent = 'All fields are Required!';
        AlertMsg2.textContent = 'Please ensure all fields are filled.';
        return;
    }

    // Validate Email Format
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        AlertMsg1.textContent='Email format is invalid!';
        AlertMsg2.textContent='Please try again.';
        return;
    }

    // Proceed with updating user data
    updateUserData(uid, email, fileInput.files[0], firstName, secondName, phoneNumber, isAdmin);
  });

  function updateUserData(uid, email, file, firstName, secondName, phoneNumber, isAdmin) {
      let formData = new FormData();
      if (file) formData.append('file', file); // Only append file if one was uploaded

      // Append other form data
      formData.append('Email', email);
      formData.append('FirstName', firstName);
      formData.append('SecondName', secondName);
      formData.append('PhoneNumber', phoneNumber);
      formData.append('Admin', isAdmin);

      let newUserInfo = userInfo;

      newUserInfo.Email = email;
      newUserInfo.FirstName = firstName;
      newUserInfo.SecondName = secondName;
      newUserInfo.PhoneNumber = phoneNumber;
      newUserInfo.Admin = isAdmin;

      // Proceed with the fetch request to update user data
      fetch('/update_user/' + uid, {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          console.log(data);
          displayUserInfo(newUserInfo);
      })
      .catch(error => {
          console.error('Error updating user:', error);
          AlertMsg1.textContent='Error updating user!';
          AlertMsg2.textContent='Please try again.';
      });
  }
}

function deleteUser(uid,userInfo) {
    // Send a DELETE request to the server
    if (userInfo.Admin === true || userInfo.Admin === 'true') {
      alert("You Can't Delete an Admin");
      return; // Exit the function early
    }


    fetch('/delete_user/' + uid, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => { console.log(data);
      let mainContainer = document.querySelector('.container');
      mainContainer.innerHTML = ''; // Clear the existing content
    
      mainContainer.innerHTML = `
          <h1 class="text-center" id="ConfirmMsg" style="color: white;"></h1>
          <div class="container-report">
            <button class="main-btn" id="AddUser" onclick="addUser()">Add User</button>
          </div>
      `;
      document.getElementById('ConfirmMsg').innerHTML = 'User Deleted successfully!';
    });
}

// Encapsulate the user-fetching logic into a function
function loadUsers() {
  console.log('Starting fetch operation to load users');
  fetch('/get_all_users')
    .then(response => {
      console.log('Received response from fetch');
      return response.json();
    })
    .then(data => {
      console.log('Received data:', data);
      // Loop through the data directly
      for (let user of data) {
          console.log('Processing user:', user);
          let row = document.createElement('tr');
          row.className = 'log-entry';

          let imageCell = document.createElement('td');
          let imageDiv = document.createElement('div');
          let image = document.createElement('img');
          image.src = user.Picture; // 'Picture' is the field containing the image URL
          image.alt = 'User Image';
          imageDiv.appendChild(image);
          imageCell.appendChild(imageDiv);

          let nameCell = document.createElement('td');
          let nameDiv = document.createElement('div');
          nameDiv.textContent = user.FirstName + ' ' + user.SecondName; // 'FirstName' and 'SecondName' are the fields containing the first and second names
          nameCell.appendChild(nameDiv);

          let uidCell = document.createElement('td');
          let uidDiv = document.createElement('div');
          uidDiv.textContent = user.id; // 'id' is the property containing the document id
          uidCell.appendChild(uidDiv);

          let actionsCell = document.createElement('td');
          actionsCell.style.textAlign = 'left'; 
          let actionsButton = document.createElement('button');
          actionsButton.textContent = 'View User';
          actionsButton.className = 'main-btn';
          actionsButton.onclick = function() {
              displayUserInfo(user);
          };
          actionsCell.appendChild(actionsButton);

          row.appendChild(imageCell);
          row.appendChild(nameCell);
          row.appendChild(uidCell);
          row.appendChild(actionsCell);

          document.getElementById('LogTable').appendChild(row);
          console.log('User processed and added to table');
      }
    })
    .catch(error => console.error('Error:', error))
    .finally(() => {
      console.log('Finished loading users');
      window.setTimeout(fadeout, 500);
    });
}

function addUser() {
  let mainContainer = document.querySelector('.container');
  mainContainer.innerHTML = ''; // Clear the existing content

  mainContainer.innerHTML = `
      
        <div class="grid-container">
        <div class="grid-item user-image" style="width: 100%;">  
        <p class="person-info">User Image<br>
        <div class="person-adInfo" style="display: flex; flex-direction: row;align-items: center;">
          <input type="file" accept="image/*" id="imageUpload" style="display: none;">
          <label for="imageUpload" class="main-btn-a" style="font-size: 10pt; width: 50%; height: 50px;">Choose Image</label>
          <div id="imagePreviewContainer" style="flex-grow: 1;"></div> <!-- Container for the image preview -->
        </div></p>
        </div>
        <div class="grid-item">
          <p class="person-info">First Name<br><div class="person-adInfo"><input type="text" id="FirstName" placeholder="First Name" class="form-control"></div></p>
        </div>
        <div class="grid-item">
          <p class="person-info">Second Name<br><div class="person-adInfo"><input type="text" id="SecondName" placeholder="Second Name" class="form-control"> </div></p>
        </div>
        <div class="grid-item">
          <p class="person-info">Email<br><div class="person-adInfo"><input type="email" id="Email" placeholder="Email" class="form-control"> </div></p>
        </div>
        <div class="grid-item">  
          <p class="person-info">Phone Number<br><div class="person-adInfo"><input type="text" id="phoneNumber" placeholder="Phone Number" class="form-control"></div></p>
        </div>
        <div class="grid-item">
          <p class="person-info">Admin<br><div class="person-adInfo"><input type="checkbox" id="isAdmin"></div></p>
        </div>
        <div class="grid-item">
          <p class="person-info">Password<br><div class="person-adInfo"><input type="password" id="Password" placeholder="Password" class="form-control"> </div></p>
        </div>
        <div class="grid-item">
          <p id="AlertMsg1" class="person-info" style="color:red; font-size: 14pt;"><div class="person-adInfo" id="AlertMsg2" style="color:red; font-size: 14pt;"></div></p>
        </div>
        </div>
        <div class="container-report">
            <button class="main-btn-d" id="CancelButton">Cancel</button>
            <button class="main-btn" id="SaveButton">Save</button>
        </div>
  `;

  let customUploadBtn = document.getElementById('imageUpload');

  // Trigger file input when the custom button is clicked
  customUploadBtn.addEventListener('click', function() {
    document.getElementById('imageUpload').click();
  });

  document.getElementById('imageUpload').addEventListener('change', function handleImageUpload() {
    if (this.files && this.files[0]) {
      let img = document.createElement('img');
      img.src = URL.createObjectURL(this.files[0]);
      img.onload = function() {
        URL.revokeObjectURL(img.src); // Free up memory by revoking object URL
      };

        // Adjust to append the image next to the label
        let imagePreviewContainer = document.getElementById('imagePreviewContainer');
        imagePreviewContainer.innerHTML = ''; // Clear any existing images
        imagePreviewContainer.appendChild(img);
    }
  });

  document.getElementById('CancelButton').addEventListener('click', function() {

    let mainContainer = document.querySelector('.container');
    mainContainer.innerHTML = ''; // Clear the existing content
  
    mainContainer.innerHTML = `
        <h1 class="text-center" id="ConfirmMsg" style="color: white;"></h1>
        <div class="container-report">
          <button class="main-btn" id="AddUser" onclick="addUser()">Add User</button>
        </div>
    `;
  
  });

  document.getElementById('SaveButton').addEventListener('click', function() {
      let email = document.getElementById('Email').value;
      let password = document.getElementById('Password').value;
      let firstName = document.getElementById('FirstName').value;
      let secondName = document.getElementById('SecondName').value;
      let phoneNumber = document.getElementById('phoneNumber').value;
      let fileInput = document.getElementById('imageUpload');
      let AlertMsg1 = document.getElementById('AlertMsg1');
      let AlertMsg2 = document.getElementById('AlertMsg2');

      // Check if any input is left empty
      if (!email || !password || !firstName || !secondName || !phoneNumber || !fileInput.files.length) {
          AlertMsg1.textContent = 'All fields are Required!';
          AlertMsg2.textContent = 'Please ensure all fields are filled and an image is uploaded.';
          return;
      }

      // Validate Email Format
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
          AlertMsg1.textContent='Email format is invalid!';
          AlertMsg2.textContent='Please try again.';
          return;
      }

      // Validate Password Length
      if (password.length < 6) {
          AlertMsg1.textContent='Password must be at least 6 characters long!';
          AlertMsg2.textContent='Please try again.';
          return;
      }

      // Validate Image Upload
      if (!fileInput.files.length) {
          AlertMsg1.textContent='Please upload an image file!';
          AlertMsg2.textContent='It should be Frontal Face & Clear';
          return;
      }

      // Proceed with saving, server will check for duplicate email
      saveFormData(email, password, fileInput.files[0], firstName, secondName, phoneNumber);
  });

  function saveFormData(email, password, file, firstName, secondName, phoneNumber) {
      let formData = new FormData();
      formData.append('file', file);

      // Append other form data
      formData.append('Email', email);
      formData.append('Password', password);
      formData.append('FirstName', firstName);
      formData.append('SecondName', secondName);
      formData.append('PhoneNumber', phoneNumber);
      formData.append('Admin', document.getElementById('isAdmin').checked);

      // Proceed with the fetch request
      fetch('/add_user', {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if(data.error) {
              // Handle server-side email existence error
              AlertMsg1.textContent='Email already exists!';
              AlertMsg2.textContent='Please try a different Email.';
          } else {
              console.log(data);
              document.getElementById('CancelButton').click();
              document.getElementById('ConfirmMsg').innerHTML = 'User added successfully!';
          }
      })
      .catch(error => {
          console.error('Error adding user:', error);
          AlertMsg1.textContent='An error occurred!';
          AlertMsg2.textContent='Please try again.';
      });
  }
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