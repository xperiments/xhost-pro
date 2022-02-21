fetch("/config.json")
  .then((r) => r.json())
  .then(({ usbDelay, usbMode }) => {
    window.XHOST_USB_DELAY = usbDelay;
    window.XHOST_USB_MODE = usbMode;
    $(".iframe").contentWindow.XHOST_USB_DELAY = usbDelay;
    $(".iframe").contentWindow.XHOST_USB_MODE = usbMode;
  });

guard__isXHOSTPRO = () => {
  return true;
};

guards = {
  ...guards,
  guard__isXHOSTPRO,
};
