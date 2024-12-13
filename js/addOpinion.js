export default function processOpnFrmData(event) {
  event.preventDefault();

  const form = this; 
  const nopName = form.elements["name"].value.trim();
  const nopMail = form.elements["email"].value.trim();
  const nopUrl = form.elements["image"].value.trim();
  const nopFeedBack = form.elements["feedback"].value.trim();
  const nopCountry = form.elements["optional"].value;

  const checkboxElements = form.querySelectorAll(
    'input[name="topics"]:checked'
  );
  const checkboxValues = Array.from(checkboxElements).map(
    (checkBox) => checkBox.value
  );

  const radioValue = form.querySelector('input[name="source"]:checked')?.value;

  if (!nopName || !nopMail || !nopFeedBack) {
    window.alert("Please, enter both your name, email, and feedback");
    return;
  }

  const newOpinion = {
    name: nopName,
    mail: nopMail,
    imgUrl: nopUrl,
    feedback: nopFeedBack,
    visitedCountry: nopCountry,
    radioAndCheckBox: {
      CheckBoxPressed: checkboxValues,
      RadioPressed: radioValue,
    },
    created: new Date().toISOString(),
  };

  let opinions = [];

  if (localStorage.feedback) {
    opinions = JSON.parse(localStorage.feedback);
  }

  opinions.push(newOpinion);
  localStorage.feedback = JSON.stringify(opinions);

  window.location.hash = "#opinions";
}

