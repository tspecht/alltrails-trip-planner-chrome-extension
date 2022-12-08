const getCurrentTrails = async () => {
  const data = await chrome.storage.local.get("savedTrails");
  return data.savedTrails || {};
};

const addToCollection = async (trail) => {
  const currentTrails = await getCurrentTrails();

  var newSavedTrails = Object.assign({}, currentTrails);
  newSavedTrails[trail.id] = trail;
  await chrome.storage.local.set({ savedTrails: newSavedTrails });

  await chrome.runtime.sendMessage({ event: "trail_added" });
};

var dataAction = undefined;


const injectItems = () => {
  var data = undefined;

  const trailPage = document.querySelector("div[data-react-class='TrailPage']");
  const searchPage = document.querySelector("div[data-react-class='SearchApp']");

  const page = trailPage || searchPage;
  const jsonData = JSON.parse(page.attributes["data-react-props"].value);

  if (jsonData.trail) {
    data = jsonData.trail;
  } else if (jsonData.initialSelectedObject) {
    data = jsonData.initialSelectedObject;
  } else if (window.location.href.includes("explore/trail")) {
    // We must be in no JSON mode. Yay react.
    // As a fallback, we will parse the necessary data from the HTML. Ugly but it'll have to do
    const latitudeElement = document.querySelector("meta[property='place:location:latitude']");
    const longitudeElement = document.querySelector("meta[property='place:location:longitude']");
    const titleElement = document.querySelector("h1[class*='TrailDetailsCard-module__name__']");
    const descriptionElement = document.querySelector("p[class*='trailOverview']");

    if (descriptionElement) {
      var durationMatches = descriptionElement.textContent.match(/an average of (\d) h (\d+) min/);
      if (durationMatches) {

        var length;
        var elevationGain;
        const statsItems = document.querySelectorAll("span[class*='module__trailStatIcons']");
        if (statsItems.length > 0) {
          statsItems.forEach(element => {
            const label = element.querySelector("span[class*='statsLabel']").textContent;
            const data = element.querySelector("span[class*='detailData']").textContent;

            if (label == "Length") {
              length = parseFloat(data.replace(" mi", "")) * 1609.34;
            } else if (label == "Elevation gain") {
              elevationGain = parseFloat(data.replace(",", "").replace(" ft", "")) * 0.3048;
            }
          });

          data = {
            length: length,
            duration_minutes_hiking: parseInt(durationMatches[1]) * 60 + parseInt(durationMatches[2]),
            elevation_gain: elevationGain,
            name: titleElement.textContent
          }

          if (latitudeElement && longitudeElement) {
            data._geoloc = {
              lat: parseFloat(latitudeElement.getAttribute("content")),
              lng: parseFloat(longitudeElement.getAttribute("content"))
            }
          }
        }
      }
    }
  }

  if (data) {
    const length = data.length;
    const hikingDuration = data.duration_minutes_hiking;
    const elevationGain = data.elevation_gain;
    const title = data.name;
    var location = undefined;
    if (data._geoloc) {
      location = {
        lat: data._geoloc.lat,
        long: data._geoloc.lng
      }
    }

    dataAction = async () => {
      await addToCollection({
        id: window.location.href,
        url: window.location.href,
        length,
        elevationGain,
        hikingDuration,
        title,
        location
      });
    };

    getCurrentTrails()
      .then(trails => {

        const addButton = document.createElement("button");
        addButton.id = "all-trails-planner-add-button"

        const styleButton = (active) => {
          addButton.style.color = "white";
          addButton.style.borderRadius = "4px";
          addButton.style.backgroundColor = "#5cb85c";
          addButton.style.borderColor = "#5cb85c";
          addButton.style.textAlign = "center";
          addButton.style.verticalAlign = "middle";
          addButton.style.fontWeight = "400";
          addButton.style.fontSize = "14px";
          addButton.style.display = "inline-block";
          addButton.style.border = "1px solid transparent";
          addButton.style.width = "150px"
          addButton.style.height = "35px";

          if (active) {
            addButton.style.opacity = 1.0;
          } else {
            addButton.style.opacity = 0.65;
          }
        }

        const isTrailAlreadyAdded = trails[window.location.href] !== undefined;

        styleButton(!isTrailAlreadyAdded);

        addButton.onclick = (event) => {
          event.stopPropagation();
          event.preventDefault();
          dataAction();
          styleButton(false);

          addButton.textContent = "Trail added";
        };

        const heading = document.querySelector("h1[class*='TrailDetailsCard-module__name__']");

        addButton.textContent = isTrailAlreadyAdded ? "Trail added" : "Add Trail";

        // Remove any pre-existing buttons
        const existingButton = document.querySelector("button[id='" + addButton.id + "']");
        if (existingButton) {
          existingButton.remove();
        }

        if (heading) {
          heading.insertAdjacentElement("beforebegin", addButton);
        }
      });
  }
};

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  const event = request.event;
  if (event) {
    if (event == "add_trail" && dataAction !== undefined) {
      await dataAction();
      injectItems();
    }

    else if (event == "remove_trail" || event == "clear_trails") {
      injectItems();
    }

    else if (event == "tab_updated") {
      // Delaying this by 1 second to give the page time to render
      setTimeout(() => {
        injectItems();
      }, 1000);
    }
  }


  sendResponse({ event: request.event, success: true });
});
