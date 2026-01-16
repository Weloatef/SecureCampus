
window.onload = function () {
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
    let buttonIds = ['EditUser', 'DeleteUser','UpdatePassword'];
    let buttonActions = ['editUser', 'deleteUser','updatePassword'];
    let buttonClasses = ['main-btn-a', 'main-btn-d','main-btn'];
    let buttonTexts = ['Edit Infromation', 'Delete Account','Update Password'];
    for (let i = 0; i < buttonIds.length; i++) {
      let button = document.createElement('button');
      button.id = buttonIds[i];
      button.className = buttonClasses[i];
      button.innerText = buttonTexts[i];
      button.onclick = function() {
        window[buttonActions[i]](user.id,user);
      };
      reportContainer.appendChild(button);
    }
  
    mainContainer.appendChild(reportContainer);
  }

  function updatePassword(uid,userInfo){
    let mainContainer = document.querySelector('.container');
    mainContainer.innerHTML = ''; // Clear the existing content
  
    mainContainer.innerHTML = `
        
          <div class="grid-container">
          <div class="grid-item">
            <p class="person-info">Current Password<br><div class="person-adInfo"><input type="password" id="CurrentPassword" placeholder="Current Password" class="form-control"></div></p>
          </div>
          <div class="grid-item">
            <p class="person-info">New Password<br><div class="person-adInfo"><input type="password" id="NewPassword" placeholder="New Password" class="form-control"></div></p>
          </div>
          <div class="grid-item">
            <p class="person-info">Confirm Password<br><div class="person-adInfo"><input type="password" id="ConfirmPassword" placeholder="Confirm Password" class="form-control"> </div></p>
          </div>
          <div class="grid-item">
            <p id="AlertMsg1" class="person-info" style="color:red; font-size: 14pt;"><div class="person-adInfo" id="AlertMsg2" style="color:red; font-size: 14pt;"></div></p>
          </div>
          </div>
          <div class="container-report">
              <button class="main-btn-d" id="CancelButtonPasswordEdit">Cancel</button>
              <button class="main-btn" id="SaveButtonPasswordEdit">Save</button>
          </div>
    `;
  
    document.getElementById('CancelButtonPasswordEdit').addEventListener('click', function() {
      fetch('/get_user_data/' + uid)
        .then(response => response.json())
        .then(data => {
          // Assuming displayUserInfo is defined and accessible
          data.id = uid; // Append uid to data as data.id
          displayUserInfo(data);
        })
        .catch(error => console.error('Error fetching user data:', error));
    });
  
    document.getElementById('SaveButtonPasswordEdit').addEventListener('click', function() {
        let currentPassword = document.getElementById('CurrentPassword').value;
        let newPassword = document.getElementById('NewPassword').value;
        let confirmPassword = document.getElementById('ConfirmPassword').value;
        let AlertMsg1 = document.getElementById('AlertMsg1');
        let AlertMsg2 = document.getElementById('AlertMsg2');
  
        // Check if any input is left empty (excluding password for edit)
        if (!currentPassword || !newPassword || !confirmPassword) {
            AlertMsg1.textContent = 'All fields are Required!';
            AlertMsg2.textContent = 'Please ensure all fields are filled.';
            return;
        }

        // Validate old Password
        if (currentPassword !== userInfo.Password) {
          AlertMsg1.textContent='Incorrect Current Password!';
          AlertMsg2.textContent='Please make sure you enter your correct current Password.';
          return;
        }
  
        // Validate Passwords
        if (newPassword !== confirmPassword) {
            AlertMsg1.textContent='Passwords Doesn\'t Match!';
            AlertMsg2.textContent='Please make sure that Passwords match.';
            return;
        }

        if (newPassword.length < 6) {
          AlertMsg1.textContent='Password must be at least 6 characters long!';
          AlertMsg2.textContent='Please try again.';
          return;
      }

        // Validate Passwords
        if (currentPassword === newPassword) {
          AlertMsg1.textContent='You can\'t use the same Password!';
          AlertMsg2.textContent='Please make sure that your new Password is differnet from your current Password.';
          return;
        }
        // Proceed with updating user data
        updatePasswordData(uid, newPassword);
        });    
  }

  function updatePasswordData(uid, newPassword) {
    let formData = new FormData();
    formData.append('Password', newPassword);
  
    // Proceed with the fetch request to update user data
    fetch('/update_password/' + uid, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        logout();
    })
    .catch(error => {
        console.error('Error updating password:', error);
        AlertMsg1.textContent='Error updating Password!';
        AlertMsg2.textContent='Please try again.';
    });
  }

  function editUser(uid,userInfo) {
  
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
      updateUserData(uid, email, fileInput.files[0], firstName, secondName, phoneNumber);
    });
  
    function updateUserData(uid, email, file, firstName, secondName, phoneNumber) {
        let formData = new FormData();
        if (file) formData.append('file', file); // Only append file if one was uploaded
  
        // Append other form data
        formData.append('Email', email);
        formData.append('FirstName', firstName);
        formData.append('SecondName', secondName);
        formData.append('PhoneNumber', phoneNumber);
  
        let newUserInfo = userInfo;
  
        newUserInfo.Email = email;
        newUserInfo.FirstName = firstName;
        newUserInfo.SecondName = secondName;
        newUserInfo.PhoneNumber = phoneNumber;
  
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
    fetch('/delete_user/' + uid, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => { console.log(data);
      logout();
    });
}

function logout() {
  fetch('/logout', {
      method: 'GET'
  })
  .then(response => {
      if (response.ok) {
          // Redirect to login page or show a message that the user has been logged out
          window.location.href = '/login'; // Assuming '/login' is your login page URL
      } else {
          console.error('Logout failed');
      }
  })
  .catch(error => console.error('Error:', error));
}
  
  function fadeout() {
    document.querySelector(".preloader").style.opacity = "0";
    document.querySelector(".preloader").style.display = "none";
  }