voila-embed-vuetify
===================

[![Version](https://img.shields.io/npm/v/voila-embed-vuetify.svg)](https://www.npmjs.com/package/voila-embed-vuetify)

A [Vue](https://vuejs.org/) component to embed [ipyvuetify](https://github.com/mariobuikhuizen/ipyvuetify)
widgets served by [Voila](https://github.com/voila-dashboards/voilà).

Installation
------------

```
npm install voila-embed-vuetify
```
or
```
yarn add voila-embed-vuetify
```

Usage
-----

```vue
<template>
  <div>
    ...
    <jupyter-widget-embed
      voila-url="http://localhost:8000"
      notebook="my-notebook.ipynb"
      mount-id="my-widget"
    ></jupyter-widget-embed>
    ...
  </div>
</template>

<script>
  import { JupyterWidgetEmbed } from 'voila-embed-vuetify'

  export default {
    name: 'MyComponent',
    components: {
      JupyterWidgetEmbed
    },
    // ...
  }

</script>
```

The displayed content while loading can be replaced by specifying your own content within the
jupyter-widget-embed tag.

In your notebook set `_metadata={'mount_id': 'my-widget'}` on a ipyvuetify widget or
`.add_traits(_metadata=traitlets.Dict(default_value={'mount_id': 'my-widget'}).tag(sync=True))` on
any other widget.


Example
-------

Make an environment:
```
$ conda create -n vev -c conda-forge voila bqplot ipyvuetify nodejs=14
$ conda activate vev
(vev) $ pip install voila-embed
(vev) $ npm install -g yarn
```

In the example directory run:
```
(vev) $ voila --no-browser --template=embed --enable_nbextensions=True --Voila.tornado_settings="{'allow_origin': 'http://localhost:8080', 'allow_credentials': True}" --port=8000
```

In another terminal in the example directory run:
```
(vev) $ yarn
(vev) $ yarn serve
```

The example site is now available on http://localhost:8080

Integration in a standard vue-cli project
-----------------------------------------

Install the library:
```
$ yarn add voila-embed-vuetify
```

Add voila-embed-vuetify to `transpileDependencies` in `vue.config.js`
```javascript
module.exports = {
  "transpileDependencies": [
    "vuetify", "voila-embed-vuetify"
  ],
}
```

Adapt 'babel.config.js' to use `usebuildIns: "entry"`:
```javascript
module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', { useBuiltIns: "entry" }]
  ]
}
```

Dev install
-----------
In the main directory run:
```
$(vev) yarn link
```

In the example directory run:
```
(vev) $ yarn
(vev) $ yarn link voila-embed-vuetify
(vev) $ yarn serve
```
