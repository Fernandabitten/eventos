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
          if (data === "/") {
            $("#msg-err").html(`
              <p>Usuário ou senha inválida. Por favor, tente novamente 1.</p>`
            );
            return true;
          }
            window.location.replace(`${data}`);    
        }
      });
    } if (user && password != user && password){
      $("#msg-err").html(`
              <p>Usuário ou senha não cadastrado ou inválido. Por favor, solicite cadastro ou tente novamente.</p>`
            );
    } else {
      $("#msg-err").html(`
      <p>Preencha todos os campos (usuário e senha) . Por favor, tente novamente .</p>`
      );
    }
  })
}); 
