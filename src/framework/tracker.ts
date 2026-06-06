let currentTrackingElement: any = null;

export function setTrackingElement(el: any) {
  currentTrackingElement = el;
}

export function getTrackingElement() {
  return currentTrackingElement;
}
