const loadConfigJson = () => {
  return fetch("/config.json")
    .then((r) => r.json())
    .then(({ usbDelay, usbMode }) => {
      window.XHOST_USB_DELAY = usbDelay;
      window.XHOST_USB_MODE = usbMode;
      $(".iframe").contentWindow.XHOST_USB_DELAY = usbDelay;
      $(".iframe").contentWindow.XHOST_USB_MODE = usbMode;
    });
};

guard__isXHOSTPRO = () => {
  return true;
};

guards = {
  ...guards,
  guard__isXHOSTPRO,
};

xhostMain = () => {
  loadConfigJson().then(() => {
    return fetch("menu.json")
      .then((r) => r.json())
      .then((r) => removeHiddenMenus(r))
      .then((menuJson) => {
        mainMenu = menuJson;
        mainMenuKeys = Object.keys(mainMenu);
        mainMenuLength = mainMenuKeys.length;
        action__showPayloads();
        generateMainMenu();
        renderMainMenu();
        if (window.autoloadGoldHen) {
          notify("Autoloading GoldHEN please wait...");
          actions["action__postBinaryPayload"]("ghen@latest.900.bin");
        }
        return menuJson;
      });
  });
};
