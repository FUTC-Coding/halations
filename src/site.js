import van from "vanjs-core";
import logo from "./futc_filled.svg";
import {
  updateCanvas,
  handleFiles,
  setBlurAmount,
  setStrength,
  setBrightnessThreshold,
  fullResDownload,
} from "./index.js";

const {
  button,
  canvas,
  div,
  h1,
  h3,
  h4,
  input,
  label,
  span,
  p,
  a,
  i,
  nav,
  img,
  main,
  dialog,
  article,
} = van.tags;

export const Dropzone = () => {
  return div({
    id: "dropzone",
    class: "dropzone",
    ondragenter: allowDrag,
    ondragover: allowDrag,
    ondragleave: hideDropZone,
    ondrop: handleDrop,
  });
};

export const Navigation = (classes) => {
  return nav(
    { class: classes },
    img({ src: logo, class: "small-margin m l" }),
    a(
      {
        onclick: (e) => {
          document.getElementById("infoDialog").showModal();
          document.getElementById("overlay").classList.add("active");
        },
      },
      i("question_mark"),
      div("Halations"),
    ),
    a(
      { href: "https://youtube.com/@futc.photography", target: "_blank" },
      i("videocam"),
      div("FUTC"),
    ),
    a(
      {
        href: "https://futc.gumroad.com/l/analoganddisposablevibes/halationify",
        target: "_blank",
      },
      i("photo_camera"),
      div("get the film look"),
    ),
  );
};

const Slider1 = (size) => {
  return nav(
    { class: "no-space no-margin center-align" },
    i("collapse_content"),
    label(
      { for: "blurRange", class: "slider " + size },
      input({
        type: "range",
        id: "blurRange",
        class: "imageSetting",
        min: "0",
        max: "100",
        step: "1",
        value: "10",
        disabled: true,
        oninput: handleSlider,
      }),
      span(),
      div({ class: "tooltip" }),
    ),
    i("expand_content"),
  );
};

const Slider2 = (size) => {
  return nav(
    { class: "no-space no-margin center-align" },
    i("remove"),
    label(
      { for: "strengthRange", class: "slider " + size },
      input({
        type: "range",
        id: "strengthRange",
        class: "imageSetting",
        min: "0",
        max: "100",
        step: "1",
        value: "50",
        disabled: true,
        oninput: handleSlider,
      }),
      span(),
      div({ class: "tooltip" }),
    ),
    i("add"),
  );
};

const Slider3 = (size) => {
  return nav(
    { class: "no-space no-margin center-align" },
    i("brightness_low"),
    label(
      { for: "brightnessRange", class: "slider " + size },
      input({
        type: "range",
        id: "brightnessRange",
        class: "imageSetting",
        min: "0",
        max: "255",
        step: "1",
        value: "200",
        disabled: true,
        oninput: handleSlider,
      }),
      span(),
      div({ class: "tooltip" }),
    ),
    i("brightness_high"),
  );
};

export const Dialogs = () => {
  return div(
    div({
      class: "overlay",
      id: "overlay",
      onclick: (e) => {
        e.target.classList.remove("active");
        document.getElementById("infoDialog").close();
      },
    }),
    div(
      { class: "snackbar primary", id: "downloadSnackbar" },
      "Processing Full Resolution Image... this can take a bit :)",
    ),
    dialog(
      { class: "left", id: "infoDialog" },
      div(
        article(
          { class: "secondary" },
          h3("What is this?"),
          p(
            "For a while I have been looking for a quick and easy way to fake halations in my digital images. It's part of my obsession with the \"Film Look\". The problem was, I didn't feel like spending a couple of minutes in photoshop for every single image I wanted to add this effect to. So I built this small web-app that allows you to add halations, tweak the effect, and get a finished image within seconds. ",
          ),
        ),
        article(
          { class: "border" },
          h3("What are Halations?"),
          div(
            p(
              "Halation is an optical phenomenon that occurs in analog film photography. When light enters the camera and strikes the film, it can sometimes penetrate the emulsion layer and then reflect off the base layer of the film. This reflected light can scatter within the film, creating a halo or glow around bright areas in the final image.",
            ),
            p(
              "Halation is particularly noticeable in areas of high contrast, such as around bright light sources or highlights. To minimize halation, films are often coated with anti-halation layers or dyes that absorb excess light and prevent it from reflecting back into the emulsion.",
            ),
            p(
              "In some cases, photographers may intentionally embrace halation as a creative effect, adding a dreamy or ethereal quality to their images. However, it can also be seen as a technical flaw, depending on the desired aesthetic and the photographer's preferences.",
            ),
          ),
        ),
        h3("How do the settings work?"),
        div(
          { class: "grid" },
          div(
            { class: "s12 l4" },
            article(
              { class: "border" },
              h3("Spread"),
              Slider1("medium"),
              p(
                "The Spread slider determines how far the effect extends from its source. Increasing the slider value causes the halations to spread farther outward from any bright areas in the image.",
              ),
            ),
          ),
          div(
            { class: "s12 l4" },
            article(
              { class: "border" },
              h3("Amount"),
              Slider2("medium"),
              p(
                "The Amount slider controls the intensity of the halation effect overlay. Raising the slider increases the intensity of the halations, resulting in higher values in the red channel for the generated halations.",
              ),
            ),
          ),
          div(
            { class: "s12 l4" },
            article(
              { class: "border" },
              h3("Threshold"),
              Slider3({ disabled: true }, "medium"),
              p(
                "The Brightness Threshold slider sets the brightness level required to initiate halations. Lowering the slider extends the effect to less bright pixels, while raising it limits halations to only the brightest pixels.",
              ),
            ),
          ),
        ),
        nav(
          { class: "right-align" },
          button(
            {
              onclick: () => {
                document.getElementById("overlay").classList.remove("active");
                document.getElementById("infoDialog").close();
              },
            },
            "cool",
          ),
        ),
      ),
    ),
  );
};

export const Main = () => {
  return main(
    { class: "container" },
    h1(
      { class: "medium-margin center-align", style: "max-width: 70%" },
      "FUTC's Halationify Tool",
    ),
    button(
      { id: "uploadButton" },
      i("attach_file"),
      span("Upload Image"),
      input({
        type: "file",
        accept: "image/*",
        onchange: (e) => {
          handleFiles(e.target.files);
        },
      }),
    ),
    h4(
      {
        class: "center-align secondary-text small medium-margin",
        style: "max-width: 50%",
      },
      "drag and drop a JPEG or PNG file anywhere on the page",
    ),
    div(
      {
        style: "position: relative;",
        class: "no-padding medium-margin center-align",
      },
      canvas({
        id: "canvas",
        style: "max-height: 50vh; max-width: 100%;",
        hidden: true,
      }),
      div(
        {
          id: "reload",
          class: "secondary-text",
          style:
            "position: absolute; top: 0px; right: 0px; cursor: pointer; display: none;",
          onclick: (e) => {
            location.reload();
          },
        },
        i("close"),
      ),
    ),
    // Spread slider
    Slider1("large"),
    // Strength slider
    Slider2("large"),
    // Threshold slider
    Slider3("large"),
    // Download button
    button(
      {
        id: "downloadBtn",
        class: "small-elevate large primary small-margin",
        disabled: true,
        onclick: handleDownload,
      },
      span("Download Processed Image"),
    ),
    p(
      { class: "center-align large-margin tertiary-text" },
      "all processing is done locally, your photos never leave your computer",
    ),
    div(
      { class: "large-margin" },
      a(
        {
          href: "https://futc.de/impressum.html",
          target: "_blank",
          class: "small-margin",
        },
        div("Impressum"),
      ),
      a(
        {
          href: "https://futc.de/datenschutz.html",
          target: "_blank",
          class: "small-margin",
        },
        div("Privacy"),
      ),
    ),
  );
};

// set darkmode
document.body.classList.add("dark");

function handleDownload() {
  document.getElementById("downloadSnackbar").classList.add("active");
  fullResDownload();
}

// Slider functionality
let debounceTimer;

function handleSlider(event) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(function () {
    if (event.target.id == "blurRange") {
      setBlurAmount(parseInt(event.target.value));
    } else if (event.target.id == "strengthRange") {
      setStrength(parseInt(event.target.value));
    } else if (event.target.id == "brightnessRange") {
      setBrightnessThreshold(parseInt(event.target.value));
    }
    updateCanvas();
  }, 100); // Adjust the delay as needed
}

// Full-page drag and drop area
var dropZone = document.getElementById("dropzone");

function showDropZone() {
  dropZone.style.display = "block";
}
function hideDropZone() {
  dropZone.style.display = "none";
}

function allowDrag(e) {
  if (
    e.dataTransfer.items[0].type == "image/jpeg" ||
    e.dataTransfer.items[0].type == "image/png"
  ) {
    // Test that the item being dragged is a valid one
    e.dataTransfer.dropEffect = "copy";
    e.preventDefault();
  } else {
    e.dataTransfer.dropEffect = "none";
    e.preventDefault();
  }
}

function handleDrop(e) {
  e.preventDefault();
  hideDropZone();

  handleFiles(e.dataTransfer.files);
}

window.addEventListener("dragenter", function (e) {
  showDropZone();
});
