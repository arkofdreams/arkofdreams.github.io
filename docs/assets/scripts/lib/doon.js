window.doon = function(selector) {
  Array.from(
    document.querySelectorAll(selector)
  ).forEach(function(container) {
    Array.from(
      container.querySelectorAll('*[data-do]')
    ).forEach(function(origin) {
      let actions = origin.getAttribute('data-do');
      if(!actions || origin.getAttribute('data-doon')) {
        return;
      }

      actions = actions.split('|');
      origin.setAttribute('data-doon', true)

      const event = origin.getAttribute('data-on');
      const target = origin.getAttribute('data-doon-target') || origin;

      //trigger init
      actions.forEach(function(action) {
        const event = new Event(`${action}-init`)
        event.for = target
        window.dispatchEvent(event)
      });

      if(!event) {
        return;
      }

      event.split('|').forEach(function(event) {
        target.addEventListener(event, function(e) {
          actions.some(function(action) {
            //mod the custom event type
            const customEvent = new e.constructor(action + '-' + event, e)
            customEvent.originalEvent = e
            customEvent.for = target
            //pass it along
            window.dispatchEvent(customEvent)
            return e.return === false
          });

          //so you can stop a form
          if (e.return === false) {
            return false;
          }
        });
      });
    });
  });
}