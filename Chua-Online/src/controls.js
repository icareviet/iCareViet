export function joystickVector(dx, dy, radius) {
  const distance = Math.hypot(dx, dy);
  if (!distance || !radius) return { x: 0, z: 0, thumbX: 0, thumbY: 0 };
  const travel = Math.min(distance, radius);
  const strength = Math.max(0, (travel / radius - .12) / .88);
  return { x: dx / distance * strength, z: dy / distance * strength, thumbX: dx / distance * travel, thumbY: dy / distance * travel };
}

export class VirtualJoystick {
  constructor(element, onMove, { windowTarget = window, documentTarget = document } = {}) {
    this.element = element; this.onMove = onMove; this.pointerId = null; this.events = new AbortController();
    const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: this.events.signal });
    listen(element, 'pointerdown', event => {
      if (this.pointerId !== null || element.disabled || event.button > 0) return;
      event.preventDefault(); this.pointerId = event.pointerId;
      element.setPointerCapture(event.pointerId); element.classList.add('engaged'); this.move(event);
    });
    listen(element, 'pointermove', event => { if (event.pointerId === this.pointerId) { event.preventDefault(); this.move(event); } });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(element, type, event => { if (event.pointerId === this.pointerId) this.reset(); });
    listen(windowTarget, 'blur', () => this.reset());
    listen(documentTarget, 'visibilitychange', () => { if (documentTarget.hidden) this.reset(); });
  }
  move(event) {
    const box = this.element.getBoundingClientRect();
    const vector = joystickVector(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2, box.width * .3);
    this.element.style.setProperty('--stick-x', `${vector.thumbX}px`);
    this.element.style.setProperty('--stick-y', `${vector.thumbY}px`);
    this.onMove(vector);
  }
  reset() {
    const pointerId = this.pointerId; this.pointerId = null;
    if (pointerId !== null && this.element.hasPointerCapture(pointerId)) this.element.releasePointerCapture(pointerId);
    this.element.classList.remove('engaged'); this.element.style.setProperty('--stick-x', '0px'); this.element.style.setProperty('--stick-y', '0px');
    this.onMove({ x: 0, z: 0 });
  }
  dispose() { this.reset(); this.events.abort(); }
}
