import Vue from 'vue'; // eslint-disable-line import/no-unresolved
import Vuetify, * as vuetifyComponents from 'vuetify/lib'; // eslint-disable-line import/no-unresolved
import { addCompiler } from '@mariobuikhuizen/vue-compiler-addon/dist/vue-compiler-addon.esm';
import { provideWidget, requestWidget } from './widgetLocator';

Vue.use(Vuetify, {
    components: Object.entries(vuetifyComponents)
        .reduce((accum, [k, v]) => ((k.startsWith('V'))
            ? ({ ...accum, [k]: v })
            : accum), {}),
});
addCompiler(Vue);

function getWidgetManager(voila, kernel) {
    try {
        /* voila < 0.1.8 */
        return new voila.WidgetManager(kernel);
    } catch (e) {
        if (e instanceof TypeError) {
            /* voila >= 0.1.8 */
            const context = {
                session: {
                    kernel,
                    kernelChanged: {
                        connect: () => {
                        },
                    },
                    statusChanged: {
                        connect: () => {
                        },
                    },
                },
                saveState: {
                    connect: () => {
                    },
                },
                /* voila >= 0.2.8 */
                sessionContext: {
                    session: {
                        kernel,
                    },
                    kernelChanged: {
                        connect: () => {
                        },
                    },
                    statusChanged: {
                        connect: () => {
                        },
                    },
                    connectionStatusChanged: {
                        connect: () => {
                        },
                    },
                },
            };

            const settings = {
                saveState: false,
            };

            const rendermime = new voila.RenderMimeRegistry({
                initialFactories: voila.standardRendererFactories,
            });

            return new voila.WidgetManager(context, rendermime, settings);
        }
        throw e;
    }
}

const notebooksLoaded = {};

let voilaLoaded = false;

async function init(voilaUrl, notebook, requestOptions) {
    const requireJsPromise = loadRequireJs(voilaUrl);
    addVoilaCss(voilaUrl);

    const notebookKey = `${voilaUrl}${notebook}`;
    if (notebooksLoaded[notebookKey]) {
        return;
    }
    notebooksLoaded[notebookKey] = true;
    const res = await fetch(`${voilaUrl}/voila/render/${notebook}`, requestOptions);
    const json = await res.json();

    await requireJsPromise;
    if (!voilaLoaded) {
        window.requirejs.config({
            baseUrl: `${voilaUrl}${json.baseUrl}voila`,
            waitSeconds: 3000,
            map: {
                '*': {
                    'jupyter-vue': `${voilaUrl}/voila/nbextensions/jupyter-vue/nodeps.js`,
                    'jupyter-vuetify': `${voilaUrl}/voila/nbextensions/jupyter-vuetify/nodeps.js`,
                },
            },
        });

        const extensions = json.extensions
            .filter((extension) => !extension.includes('jupyter-vue'))
            .map((extension) => `${voilaUrl}${extension}`);

        window.requirejs(extensions);

        voilaLoaded = true;
    }

    window.requirejs(['static/voila'], (voila) => {
        window.define('vue', [], () => Vue);
        (async () => {
            const kernel = await voila.connectKernel(`${voilaUrl}${json.baseUrl}`, json.kernelId);

            /* Workaround for the 3-second kernel connection delay on start up. Can be removed when
             * https://github.com/jupyterlab/jupyterlab/pull/10321 is released and used by Voila */
            kernel._kernelSession = '_RESTARTING_';

            const widgetManager = getWidgetManager(voila, kernel);
            await widgetManager._build_models();

            Object.values(widgetManager._models)
                .map(async (modelPromise) => {
                    const model = await modelPromise;
                    const meta = model.get('_metadata');
                    const mountId = meta && meta.mount_id;
                    if (mountId) {
                        provideWidget({ voilaUrl, notebook, mountId }, model);
                    }
                });
        })();
    });
}

function loadRequireJs(voilaUrl) {
    if (document.getElementById('tag-requirejs')) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${voilaUrl}/voila/static/require.min.js`;
        script.id = 'tag-requirejs';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function addVoilaCss(voilaUrl) {
    if (!document.getElementById('tag-index.css')) {
        const link = document.createElement('link');
        link.href = `${voilaUrl}/voila/static/index.css`;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.id = 'tag-index.css';
        document.head.appendChild(link);
    }
    if (!document.getElementById('tag-theme-light.css')) {
        const link = document.createElement('link');
        link.href = `${voilaUrl}/voila/static/theme-light.css`;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.id = 'tag-theme-light.css';
        document.head.appendChild(link);
    }
}

export default {
    name: 'JupyterWidgetEmbed',
    props: ['voila-url', 'notebook', 'mount-id', 'request-options'],
    data() {
        return {
            renderFn: undefined,
            elem: undefined,
        };
    },
    created() {
        init(this.voilaUrl, this.notebook, this.requestOptions);
    },
    mounted() {
        requestWidget(this.$props)
            .then((model) => model.widget_manager.create_view(model))
            .then((widgetView) => {
                if (['VuetifyView', 'VuetifyTemplateView'].includes(widgetView.model.get('_view_name'))) {
                    this.renderFn = (createElement) => widgetView.vueRender(createElement);
                } else {
                    while (this.$el.firstChild) {
                        this.$el.removeChild(this.$el.firstChild);
                    }

                    window.requirejs(['@jupyter-widgets/base'], (widgets) => {
                        widgets.JupyterPhosphorWidget.attach(widgetView.pWidget, this.$el);
                    });
                }
            });
    },
    render(createElement) {
        if (this.renderFn) {
            /* workaround for v-menu click */
            if (!this.elem) {
                this.elem = this.renderFn(createElement);
            }
            return this.elem;
        }
        return createElement('div', this.$slots.default
            || [createElement(
                'v-chip',
                { staticStyle: { 'white-space': 'initial' } },
                [`[${this.notebook} - ${this.mountId}]`,
                    createElement('v-progress-circular', { attrs: { indeterminate: true } }),
                ],
            )]);
    },
};
