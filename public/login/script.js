$(document).ready(() => {
  $("#login-button").on("click", function () {
    let user = $("#user").val();
    let password = $("#password").val();
    if (user && password) {
      $.ajax({
        url: "/login",
        type: "POST",
        data: { username: user, password: password },
        success: function (data) {
          window.location.replace(`${data}`);    
        },
        error: function() {
          $("#msg-err").html(`
          <p>Usuário ou senha inválida. Por favor, tente novamente.</p>`  
          )  
        }
      });
    } else {
      $("#msg-err").html(`
      <p>Por favor, preencha todos os campos.</p>`
      );
    };
    setTimeout(() => {
      $("#msg-err").html(``);
    }, 1500);
  });
}); 
