const addToCollection = (trail) => {
  chrome.storage.local.get("savedTrails", function (collection) {
    var newSavedTrails = Object.assign({}, collection.savedTrails);
    newSavedTrails[trail.id] = trail;
    chrome.storage.local.set({ savedTrails: newSavedTrails });

    chrome.runtime.sendMessage({ event: "trail_added" });
  });
};


window.onload = function () {
  var data = undefined;

  const trailPage = document.querySelector("div[data-react-class='TrailPage']");
  const searchPage = document.querySelector("div[data-react-class='SearchApp']");

  if (trailPage) {
    data = JSON.parse(trailPage.attributes["data-react-props"].value).trail;
  } else if (searchPage) {
    data = JSON.parse(searchPage.attributes["data-react-props"].value).initialSelectedObject;
  }
 
  if (data) {
    const length = data.length;
    const hikingDuration = data.duration_minutes_hiking;
    const elevationGain = data.elevation_gain;
    const trailId = data.ID;
    const title = data.name;
    const location = {
      lat: data._geoloc.lat,
      long: data._geoloc.lng
    };

    const dataAction = (event) => {
      if (event) {
        event.stopPropagation();
      }
      addToCollection({
        id: trailId,
        url: window.location.href,
        length,
        elevationGain,
        hikingDuration,
        title,
        location
      });
    };

    const addButton = document.createElement("button");
    addButton.onclick = dataAction;

    const heading = document.querySelector("h1[class*='TrailDetailsCard-module__name__']");

    addButton.style.color = "white";
    addButton.style.borderRadius = "4px";
    addButton.style.backgroundColor = "#5cb85c";
    addButton.style.borderColor = "#5cb85c";
    addButton.style.textAlign = "center";
    addButton.style.verticalAlign = "middle";
    addButton.style.fontWeight = "400";
    addButton.style.fontSize = "14px";
    addButton.style.display = "inline-block";
    addButton.style.borderWidth = "0px";
    addButton.style.width = "150px"
    addButton.style.height = "35px";

    addButton.textContent = "Add Trail";

    heading.insertAdjacentElement("beforebegin", addButton);

    chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
      console.log("All Trails Message: ", request.event);

      dataAction();

      sendResponse({ event: request.event, success: true});
  });
  }
};