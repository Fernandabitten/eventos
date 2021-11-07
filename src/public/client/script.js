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

  const loadEvents = () => {
    $.ajax({
      url: "/events",
      type: "GET",
      data: {},
      success: function (data) {
        let textReference = "";
        for (let key in data) {
          textReference += ` <div class="write-events" id="event-${data[key].title}">
          <label id="l" for="r"></label>
            <span class="content-events" >${data[key].title}</span>
            <span class="content-events">${data[key].description}</span>
            <span class="content-events">${data[key].date}</span>
            <span class="content-events">${data[key].time} h</span>
            <span class="content-events" >${data[key].location}</span>
            <input type="button" class="event-button" data-event-id="${data[key].id}" data-event-title="${data[key].title}" id="cadastrarNoEvento-${data[key].id}" value="Verificar evento" />                                  
          </div>`;
        }
        $("#events").html(textReference);
        $(".event-button").on("click", function () {
          const eventId = $(this).attr("data-event-id");
          const eventTitle = $(this).attr("data-event-title");
          $("#content").css("display", "none");
          $.ajax({
            url: "/check-event",
            type: "POST",
            data: { eventId, eventTitle },
            success: function (data) {
              $("#actual-event").html(data.htmlText);
              if (data.exists === true && data.used === false) {
                console.log("data.qrcode: ", data.qrcode);
                let qr = qrcode(4, "L");
                qr.addData(data.qrcode);
                qr.make();
                $("#placeHolder").html(
                  qr.createImgTag(4, 8, "Imagem de Q R code")
                );
              }
              $("#confirmarCadastrarNoEvento-button").on("click", function () {
                $.ajax({
                  url: "/register-user-event",
                  type: "POST",
                  data: {
                    id: eventId,
                  },
                  success: function () {
                    $("#actual-event").html("");
                    $("#message").html(
                      `<h2>Cadastrado no evento ${eventTitle}</h2>`
                    );
                    setTimeout(() => {
                      $("#message").html("");
                      $("#content").css("display", "flex");
                    }, 1500);
                  },
                });
              });
              $("#sair").on("click", function () {
                $("#content").css("display", "flex");
                $("#actual-event").html("");
              });
            },
          });
        });
      },
    });
  };
  loadEvents();
});
