let currentEventId = null;
const registerInEvent = (id) => {
  currentEventId = id;
};
$(document).ready(() => {
  $.ajax({
    url: "/verify",
    type: "GET",
    data: {},
    success: (data) => {
      if (data !== null || data !== undefined) {
        window.location.replace(data);
      }
    },
  });

  $("#logout-button").on("click", function () {
    window.location.replace("/");
    $.ajax({
      url: "/log-out",
      type: "GET",
      data: {},
      success: function () {
        console.log("logged out");
      },
    });
  });

  $("#confirmarCadastrarNoEvento-button").on("click", function () {
    $.ajax({
      url: "/register-user-event",
      type: "POST",
      data: {
        id: currentEventId,
      },
      success: function (data) {
        console.log(data);
      },
    });
  });

  $("#events").on("click", function () {
    $("#textareaRegisterEvents").css("display", "flex");
  });

  $("#event-button").on("click", function () {
    $("#textareawrite").css("display", "flex");
  });

  $("#user-button").on("click", function () {
    $("#textareaUser").css("display", "flex");
  });

  $("#listUsers-button").on("click", function () {
    $("#textareaListUsers").css("display", "flex");
    $.ajax({
      url: "/user",
      type: "GET",
      data: {},
      success: function (data) {
        if (data === "/") {
          window.location.replace(`${data}`);
          return true;
        }
        let textReference = "";
        for (let key in data) {
          textReference += `  <div class="write-users" id="users-${data[key].username}">
                <span class="content-users" >${data[key].username}</span>
                <span class="content-users">${data[key].fullname}</span>             
               </div>`;
          $("#users").html(textReference);
        }
      },
    });
  });

  $("#cancel-events").on("click", function () {
    $("#textareawrite").css("display", "none");
  });

  $("#cancel-user").on("click", function () {
    $("#textareaUser").css("display", "none");
  });

  $("#home").on("click", function () {
    $("#textareaListUsers").css("display", "none");
  });

  $("#sair").on("click", function () {
    $("#textareaRegisterEvents").css("display", "none");
  });

  $("#send-events").on("click", function () {
    let eventName = $("#event-name").val();
    let eventDescription = $("#event-description").val();
    let eventDate = $("#event-date").val();
    let eventTime = $("#event-time").val();
    let eventPlace = $("#event-place").val();

    $.ajax({
      url: "/register-event",
      type: "POST",
      data: {
        title: eventName,
        description: eventDescription,
        date: eventDate,
        location: eventPlace,
        time: eventTime,
      },
      success: function (data) {
        if (data === "/") {
          window.location.replace(`${data}`);
          return true;
        }
        loadEvents();
        $("#textareawrite").css("display", "none");
        $("#event-name").val("");
        $("#event-description").val("");
        $("#event-date").val("");
        $("#event-time").val("");
        $("#event-place").val("");
      },
    });
  });

  $("#send-user").on("click", function () {
    let username = $("#username").val();
    let fullname = $("#fullname").val();
    let password = $("#password").val();

    $.ajax({
      url: "/register",
      type: "POST",
      data: { username: username, fullname: fullname, password: password },
      success: function (data) {
        if (data === "/") {
          window.location.replace(`${data}`);
          return true;
        }
        $("#user-content").val("");
        $("#textareaUser").css("display", "none");
      },
    });
    $("#fullname").val("");
    $("#username").val("");
    $("#password").val("");
  });

  function readImage() {
    if (this.files && this.files[0]) {
        var file = new FileReader();
        file.onload = function(e) {
            document.getElementById("preview").src = e.target.result;
        };       
        file.readAsDataURL(this.files[0]);
    }
}

  const loadEvents = () => {
    $.ajax({
      url: "/events",
      type: "GET",
      data: {},
      success: function (data) {
        if (data === "/") {
          window.location.replace(`${data}`);
          return true;
        }
        let textReference = "";
        for (let key in data) {
          textReference += `  <div class="write-events" id="event-${data[key].title}">    
            <span class="content-events" >${data[key].title}</span>
            <span class="content-events">${data[key].description}</span>
            <span class="content-events">${data[key].date}</span>
            <span class="content-events">${data[key].time} h</span>
            <span class="content-events" >${data[key].location}</span>
            <button type='button' onClick="registerInEvent('${data[key].id}')" id="cadastrarNoEvento-button">Cadastrar no Evento</button>                                   
          </div>`;
        }
        $("#events").html(textReference);
      },
    });
  };
  loadEvents();
});
