<template>
    <div>
        <jupyter-widget-embed
                voila-url="http://localhost:8000"
                notebook="bqplot_vuetify_example.ipynb"
                mount-id="content-main"
                :request-options=requestOptions
        ></jupyter-widget-embed>
        <jupyter-widget-embed
                voila-url="http://localhost:8000"
                notebook="notebook2.ipynb"
                mount-id="dialog"
                :request-options=requestOptions
        ></jupyter-widget-embed>
        <jupyter-widget-embed
                style="margin-top: 40px"
                voila-url="http://localhost:8000"
                notebook="bqplot_vuetify_example.ipynb"
                mount-id="histogram_bins2"
                :request-options=requestOptions
        ></jupyter-widget-embed>
        <v-card v-if="sliderModel" class="ma-4 mx-auto" width="600">
            <v-card-title class="headline">Access widget models from the page</v-card-title>
            <v-card-text>
                <v-row style="height: 60px">
                    <v-col cols="3">
                        <v-chip class="px-2">bins: {{ bins }}</v-chip>
                    </v-col>
                    <v-col class="flex-grow-1">
                        <v-slider v-model="bins" hide-details></v-slider>
                    </v-col>
                </v-row>
                <v-row class="align-center">
                    <v-col cols="3">
                        <jupyter-widget-embed
                                voila-url="http://localhost:8000"
                                notebook="notebook2.ipynb"
                                mount-id="event_demo"
                                :request-options=requestOptions
                        ></jupyter-widget-embed>
                    </v-col>
                    <v-col class="flex-grow-1">
                        <v-btn @click="sendClickEvent" class="mr-2">Send click event</v-btn>
                        <v-btn @click="sendCustomEvent">Send custom event</v-btn>
                    </v-col>
                </v-row>
                <v-row class="align-center">
                    <v-col cols="3">
                        <jupyter-widget-embed
                                voila-url="http://localhost:8000"
                                notebook="notebook2.ipynb"
                                mount-id="template_event_demo"
                                :request-options=requestOptions
                        ></jupyter-widget-embed>
                    </v-col>
                    <v-col class="flex-grow-1">
                        <v-btn @click="sendClickEventTemplate">Send click event (template)</v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <v-card v-if="sliderModel" class="ma-4 mx-auto" width="600">
            <v-card-title class="headline">Debug</v-card-title>
            <v-card-text>
                <jupyter-widget-embed
                        voila-url="http://localhost:8000"
                        notebook="notebook2.ipynb"
                        mount-id="out"
                        :request-options=requestOptions
                ></jupyter-widget-embed>
            </v-card-text>
        </v-card>
    </div>
</template>

<script>
    import { requestWidget, JupyterWidgetEmbed } from 'voila-embed-vuetify';

    export default {
        name: "Demo",
        components: {
            JupyterWidgetEmbed
        },
        data() {
            return {
                sliderModel: null,
                bins: null,
                requestOptions: {"credentials": 'include'},

                eventDemoModel: null,
                templateEventDemoModel: null,
            }
        },
        created() {
            /* Get the widgets models. These are backbone.js models, see
             * https://backbonejs.org/#Model for more information */
            requestWidget({
                voilaUrl: 'http://localhost:8000',
                notebook: 'bqplot_vuetify_example.ipynb',
                mountId: 'histogram_bins2',
            }).then(sliderModel => {
                this.sliderModel = sliderModel;

                /* sync widget model changes to the vue model */
                this.bins = sliderModel.get('v_model');
                sliderModel.on('change:v_model', () => {
                    this.bins = sliderModel.get('v_model')
                });
            });

            requestWidget({
                voilaUrl: 'http://localhost:8000',
                notebook: 'notebook2.ipynb',
                mountId: 'event_demo',
            }).then(eventDemoModel => {
                this.eventDemoModel = eventDemoModel;
            });

            requestWidget({
                voilaUrl: 'http://localhost:8000',
                notebook: 'notebook2.ipynb',
                mountId: 'template_event_demo',
            }).then(templateEventDemoModel => {
                this.templateEventDemoModel = templateEventDemoModel;
            });
        },
        watch: {
            /* sync vue model change to the widget model */
            bins(value) {
                if (this.sliderModel && value !== null) {
                    this.sliderModel.set('v_model', value);
                    this.sliderModel.save_changes();
                }
            },
        },
        methods: {
            sendClickEvent() {
                this.eventDemoModel.send({
                    event: 'click',
                    data: {},
                });
            },
            sendCustomEvent() {
                this.eventDemoModel.send({
                    type: 'custom',
                    time: new Date().toISOString().substr(11, 8),
                });
            },
            sendClickEventTemplate() {
                this.templateEventDemoModel.send({
                    event: 'my_click',
                    data: {},
                });
            }
        },
    }
</script>

<style scoped>

</style>