$(document).ready(function(){
    getQuestions();
});

function getQuestions(){
    $.getJSON('/questions/list', function (data){
        console.log(data);
    });
}
