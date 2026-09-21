const mounted = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Mount the small desk toys. No animation runs until the visitor plays. */
export function mountDeskToys(root = document) {
  const doc = root.ownerDocument || root;
  const view = doc.defaultView;
  if (!view?.requestAnimationFrame || !root.querySelectorAll) return () => {};
  const reduced = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const controllers = new Map();
  let destroyed = false;

  for (const button of root.querySelectorAll('button[data-desk-toy]')) {
    const kind = button.dataset.deskToy;
    const movingSelector = {zhu: '.desk-toy-rocker', windmill: '.desk-toy-wheel'}[kind];
    if (!movingSelector) continue;
    const moving = button.querySelector(movingSelector);
    if (!moving) continue;
    mounted.get(button)?.destroy();
    const shadow = button.querySelector('.desk-toy-shadow');
    const original = {transform: moving.style.transform, shadow: shadow?.style.transform,
      touchAction: button.style.touchAction, label: button.getAttribute('aria-label')};
    if (!original.label) button.setAttribute('aria-label', kind === 'zhu'
      ? '拨一拨小朱不倒翁，松手后慢慢站稳' : '拨一拨纸风车，让它转动后慢慢停下');
    // Keep native vertical scrolling and pinch zoom available on the toy itself.
    button.style.touchAction = 'pan-y pinch-zoom';
    let angle = kind === 'zhu' ? 0 : -12;
    let velocity = 0, frame = 0, lastTime = null, pointer = null;
    let visible = true, disposed = false, skipPointerClick = false;
    const listeners = [];
    const canMove = () => !disposed && visible && !doc.hidden && !reduced?.matches;
    const on = (type, callback) => {
      button.addEventListener(type, callback);
      listeners.push([type, callback]);
    };
    function paint() {
      if (kind === 'zhu') {
        const roll = angle * .18;
        moving.style.transform = `translateX(${roll}%) rotate(${angle}deg)`;
        if (shadow) shadow.style.transform = `translateX(${roll * .8}%) scaleX(${1 - Math.abs(angle) / 160})`;
      } else moving.style.transform = `rotate(${angle}deg)`;
    }
    function stopFrame() {
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = null;
    }
    function releasePointer() {
      const previous = pointer;
      pointer = null;
      if (previous && button.hasPointerCapture?.(previous.id)) button.releasePointerCapture(previous.id);
    }
    function rest() {
      if (disposed) return;
      stopFrame();
      velocity = 0;
      if (pointer) skipPointerClick = true;
      releasePointer();
      angle = kind === 'zhu' ? 0 : angle % 360;
      paint();
    }
    function step(time) {
      frame = 0;
      if (!canMove()) { rest(); return; }
      const dt = lastTime === null ? 1 / 60 : clamp((time - lastTime) / 1000, 0, .032);
      lastTime = time;
      if (kind === 'zhu') {
        velocity += (-75 * angle - 6.3 * velocity) * dt;
        angle += velocity * dt;
        if (Math.abs(angle) > 32) { angle = clamp(angle, -32, 32); velocity *= -.35; }
        if (Math.abs(angle) < .04 && Math.abs(velocity) < .3) { rest(); return; }
      } else {
        angle += velocity * dt;
        velocity *= Math.exp(-1.8 * dt);
        if (Math.abs(velocity) < 6) { rest(); return; }
      }
      paint();
      frame = view.requestAnimationFrame(step);
    }
    function wake() {
      if (!canMove()) { rest(); return; }
      if (!frame) frame = view.requestAnimationFrame(step);
    }
    on('pointerdown', event => {
      if (!canMove() || event.button !== 0 || event.isPrimary === false || pointer) return;
      skipPointerClick = false;
      stopFrame();
      pointer = {id: event.pointerId, type: event.pointerType, x: event.clientX, y: event.clientY,
        angle, lastX: event.clientX, lastAt: event.timeStamp, speed: 0, dragging: false};
    });
    on('pointermove', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!pointer.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) >= Math.abs(dx)) { rest(); return; }
        pointer.dragging = true;
        button.setPointerCapture?.(pointer.id);
      }
      if (event.cancelable) event.preventDefault();
      const scale = (kind === 'zhu' ? 40 : 260) / Math.max(button.getBoundingClientRect().width, 48);
      const elapsed = event.timeStamp - pointer.lastAt;
      if (elapsed > 0) pointer.speed = clamp((event.clientX - pointer.lastX) / elapsed * scale * 1000,
        kind === 'zhu' ? -180 : -1300,
        kind === 'zhu' ? 180 : 1300);
      pointer.lastX = event.clientX;
      pointer.lastAt = event.timeStamp;
      angle = kind === 'zhu' ? clamp(pointer.angle + dx * scale, -28, 28) : pointer.angle + dx * scale;
      paint();
    });
    on('pointerup', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const {dragging, lastAt, speed} = pointer;
      velocity = event.timeStamp - lastAt > 90 ? 0 : speed * (kind === 'zhu' ? .35 : 1);
      skipPointerClick = dragging;
      releasePointer();
      if (dragging) wake();
    });
    const cancelGesture = event => {
      if (pointer && pointer.id === event.pointerId) rest();
    };
    on('pointercancel', cancelGesture);
    on('lostpointercapture', cancelGesture);
    on('pointerleave', event => {
      if (pointer?.type === 'mouse' && !pointer.dragging) cancelGesture(event);
    });
    on('click', event => {
      if (skipPointerClick && event.detail !== 0) { skipPointerClick = false; return; }
      skipPointerClick = false;
      if (!canMove()) return;
      const box = button.getBoundingClientRect();
      const side = event.detail === 0 || event.clientX < box.left + box.width / 2 ? 1 : -1;
      velocity = kind === 'zhu' ? clamp(velocity + side * 175, -230, 230) : 1050;
      wake();
    });
    paint();
    const controller = {
      rest,
      setVisible(value) { visible = value; if (!value) rest(); },
      destroy() {
        if (disposed) return;
        rest();
        disposed = true;
        for (const [type, callback] of listeners) button.removeEventListener(type, callback);
        moving.style.transform = original.transform;
        if (shadow) shadow.style.transform = original.shadow;
        button.style.touchAction = original.touchAction;
        if (!original.label) button.removeAttribute('aria-label');
        if (mounted.get(button) === controller) mounted.delete(button);
      }
    };
    controllers.set(button, controller);
    mounted.set(button, controller);
  }
  if (!controllers.size) return () => {};
  const observer = view.IntersectionObserver ? new view.IntersectionObserver(entries => {
    for (const entry of entries) controllers.get(entry.target)?.setVisible(entry.isIntersecting);
  }, {threshold: 0}) : null;
  for (const button of controllers.keys()) observer?.observe(button);
  const stopWhenHidden = () => { if (doc.hidden) controllers.forEach(control => control.rest()); };
  const stopWhenReduced = () => { if (reduced?.matches) controllers.forEach(control => control.rest()); };
  doc.addEventListener('visibilitychange', stopWhenHidden);
  if (reduced?.addEventListener) reduced.addEventListener('change', stopWhenReduced);
  else reduced?.addListener?.(stopWhenReduced);
  return () => {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    doc.removeEventListener('visibilitychange', stopWhenHidden);
    if (reduced?.removeEventListener) reduced.removeEventListener('change', stopWhenReduced);
    else reduced?.removeListener?.(stopWhenReduced);
    controllers.forEach(control => control.destroy());
  };
}
