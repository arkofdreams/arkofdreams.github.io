;(async () => {
  const range = [...Array(839).keys()]
  const images = range.map((count) => `assets/images/sequence/Image_seq_60FS/Main comp_${String(count).padStart(5, 0)}.jpg`)

  var obj = { curImg: 0 }
  var tween = TweenMax.to(obj, 0.5, {
    curImg: images.length - 1, // animate propery curImg to number of images
    roundProps: "curImg", // only integers so it can be used as an array index
    repeat: 3, // repeat 3 times
    immediateRender: true, // load first image automatically
    ease: Linear.easeNone, // show every image the same ammount of time
    onUpdate: function () {
      $("#myimg").attr("src", images[obj.curImg]) // set the image source
    },
  })
  // init controller
  var controller = new ScrollMagic.Controller()
  // build scene
  const imgScene = document.getElementById('body-header')
  var scene = new ScrollMagic.Scene({ triggerElement: imgScene, duration: 800, triggerHook: 0.001 })
    .setTween(tween)
    // .addIndicators() 
    .addTo(controller)
    .setPin(imgScene, { pushFollowers : true })
})()
