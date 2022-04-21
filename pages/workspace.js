console.log("Script is loaded");
const jQ = document.createElement("script");
jQ.src = "https://code.jquery.com/jquery-3.4.1.min.js";
jQ.type = "text/javascript";
document.getElementsByTagName("head")[0].appendChild(jQ);
jQ.addEventListener("load", () => {
  jQuery(document).ready(() => {
    const targetNode = document.getElementById("root");
    console.log("targetNode => ", targetNode);

    // Options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = function (mutationsList, observer) {
      // Use traditional 'for loops' for IE 11
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          if (
            mutation.addedNodes[0] &&
            mutation.addedNodes[0].id === "dashboard"
          ) {
            jQuery("#app").on(
              "click",
              ".project-list__item-actions",
              addDeployOption
            );
            observer.disconnect();
          }
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    // Later, you can stop observing
    // observer.disconnect();
  });
});

const addDeployOption = (e) => {
  const projectName = jQuery(e.currentTarget)
    .parents(".project-list__list-item")
    .find(".project-list__item-title")
    .text()
    .split("::")[0];
  const projectVersion = (
    jQuery(e.currentTarget)
      .parents(".project-list__list-item")
      .find(".project-list__item-title")
      .text()
      .split("::")[1] || ""
  ).replace("ver", "");
  const envName = jQuery(e.currentTarget)
    .parents(".main-list-body")
    .siblings(".main-list-header")
    .find(".main-list-header__title")
    .val();
  if (["Dev", "Beta", "Prod"].includes(envName)) {
    setTimeout(() => {
      const menuItem = jQuery(".vf-menu").find(".vf-menu__item")[0];
      const deployOption = jQuery(menuItem).clone();
      jQuery(deployOption[0]).find("div").text(`Deploy to ${envName}`);
      jQuery(deployOption[0])
        .find("div")
        .click((e) => {
          e.stopPropagation();
          e.preventDefault();
          deployBot(projectName, projectVersion, envName);
        });
      console.log(deployOption, menuItem);
      deployOption.insertBefore(menuItem);
      console.log(projectName, projectVersion, envName);
    }, 300);
  }
};
const deployBot = async (name, version, environment) => {
  await fetch(`https://bot-service.chat-prod.cresta.ai/bot-deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      botName: name,
      botEnvironment: environment,
      botVersion: version.toLowerCase(),
    }),
  })
    .then(async (response) => {
      if (response.status < 400) {
        const visitSlack = confirm(
          "Deployment is initiated, switch to slack for status?"
        );
        if (visitSlack) {
          window.open(
            "https://crestalabs.slack.com/archives/C034GDYAF0S",
            "_blank"
          );
        }
      } else {
        const jsonBody = await response.json();
        alert(
          `Error ${response.status}: Bot deployment failed with ${
            response.statusText
          }, ${JSON.stringify(jsonBody)}`
        );
      }
    })
    .catch((err) => {
      alert(err.message);
      console.error("fetcher error", err);
    });
};
