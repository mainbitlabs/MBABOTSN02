/**

                  _       _____  _       _             
                 (_)     |  __ \(_)     | |            
  _ __ ___   __ _ _ _ __ | |  | |_  __ _| | ___   __ _ 
 | '_ ` _ \ / _` | | '_ \| |  | | |/ _` | |/ _ \ / _` |
 | | | | | | (_| | | | | | |__| | | (_| | | (_) | (_| |
 |_| |_| |_|\__,_|_|_| |_|_____/|_|\__,_|_|\___/ \__, |
                                                  __/ |
                                                 |___/ 

 */
const config = require('../config');
const axios = require ('axios');


// Dialogos
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const {CardFactory} = require('botbuilder');
const { ChoiceFactory, ChoicePrompt, TextPrompt, WaterfallDialog} = require('botbuilder-dialogs');
const { ActualizarSNDialog, ACTUALIZARSN_DIALOG } = require('./actualizarSN');
const moment = require('moment-timezone');

const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

class MainDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'mainDialog');

        // this.addDialog(new FallaDialog());
        this.addDialog(new ActualizarSNDialog());
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.tipoStep.bind(this),
            this.proyectoStep.bind(this),
            this.serieStep.bind(this),
            this.infoConfirmStep.bind(this),
            this.dispatcher.bind(this),
            this.choiceDialog.bind(this),
            this.finalDialog.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

async tipoStep(step){
    console.log('[mainDialog]:TipoStep');
    await step.context.sendActivity('Recuerda que este bot tiene un tiempo limite de 10 minutos.');
    await step.context.sendActivity(`Si tienes algun problema puedes reiniciar este Bot en cualquier momento, escribiendo la palabra **Cancelar**`);
    return await step.prompt(TEXT_PROMPT, `Por favor, **escribe el proyecto que deseas consultar.**`);
}

async proyectoStep(step){
    console.log('[mainDialog]:ProyectoStep');
    const proyecto = step.result.toUpperCase();
    const trim = proyecto.replace(/ /g,"");
    const tron = trim.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
    console.log("Trim: ",trim);
    console.log("Tron: ",tron);
    const details = step.options;
        details.proyecto = tron;

switch (details.proyecto) {
    case "SAT":
    case "INE":
        const message = `Por favor, **indica el tipo de Ticket de ServiceNow que deseas consultar.**`;
        return await step.prompt(CHOICE_PROMPT, {
            prompt: message,
            choices: ChoiceFactory.toChoices(['Incidente', 'Requerimiento'])
        });
    
    default:
        console.log(details.proyecto);
        await step.context.sendActivity(`El proyecto **${details.proyecto}** no está registrado en la base de datos.`);
        return await step.endDialog();   
    }
}
async serieStep(step){
    console.log('[mainDialog]:SerieStep');

    const tipo = step.result.value;
    const details = step.options;
        details.tipo = tipo;

    return await step.prompt(TEXT_PROMPT, `Por favor, **escribe el Número de Ticket de ServiceNow que deseas consultar.**`);
}

async infoConfirmStep(step) {
    console.log('[mainDialog]:infoConfirmStep <<inicia>>');

    const ticket = step.result.toUpperCase();
    const trim = ticket.replace(/ /g,"");
    const tron = trim.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
    console.log("Trim: ",trim);
    console.log("Tron: ",tron);
    const details = step.options;
        details.ticket = tron;
    
    console.log(details);

    await step.context.sendActivities([ 
        { type: 'typing' },
        { type: 'delay', value: 2000 },
        { type: 'message', text:'Por favor espera un momento, estamos trabajando en ello...'}
    ]);

    let qfoliosn = "";
    
    switch (details.proyecto) {
        
        case "SAT":
        qfoliosn = config.foliosn.SAT;
            break;
        
        case "INE":
        qfoliosn = config.foliosn.INE;
            break
        
        default:
            break;
    }
console.log("Qfolio: " + qfoliosn);
    //const id = details.result.toUpperCase().replace(/ /g,'');
    //details.ticket = id;
console.log("Details.ticket: "+ details.ticket);
    if (details.tipo === "Incidente") {
        details.tabla = "incident";
        const result = async function asyncFunc() {
            try {
                const url = config.url + "/table/" + details.tabla + "?sysparm_query=" + qfoliosn + "STARTSWITH" + details.ticket +"&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=1";
                console.log("URL INC : ",url);
                const response =  await axios.get(
                url,
                  {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from(config.sn).toString('base64'))}} ,
          
                );
                const data = await response;
               
                console.log("#Incidente ", data.data.result[0].number);
                details.sysid = data.data.result[0].sys_id; 
                details.description = data.data.result[0].description; 
                console.log(details.sysid);
                //console.log(details.description);
                
                // const msg=(` **Ticket:** ${data.data.result[0].number}\n\n **Proyecto:** ${data.data.result[0].sys_domain}\n\n **Número de Serie**: ${data.data.result[0].u_ci} \n\n  **Categoría** ${data.data.result[0].category} \n\n **Subcategoría** ${data.data.result[0].subcategory} \n\n  **Subcategoría_L2** ${data.data.result[0].u_subcategory_l2} \n\n **Subcategoría_L3** ${data.data.result[0].u_subcategory_l3} \n\n**Subcategoría_L4** ${data.data.result[0].u_subcategory_l4} \n\n**Descripción ** ${data.data.result[0].short_description} \n\n**Detalle** ${data.data.result[0].description} \n\n`);
                // await step.context.sendActivity(msg);
                await step.context.sendActivity({
                    attachments: [
                              {
                                "contentType": "application/vnd.microsoft.card.adaptive",
                                "content": {
                                  "type": "AdaptiveCard",
                                  "version": "1.0",
                                  "body": [
                                    
                                    {
                                        "type": "ColumnSet",
                                        "columns": [
                                            {
                                                "type": "Column",
                                                "width": "stretch",
                                                "items": [
                                                    {
                                                        "type": "Image",
                                                        "altText": "",
                                                        "url": "https://raw.githubusercontent.com/esanchezlMBT/images/master/ServiceNow-logo.png"
                                                    }
                                                ],
                                                "separator": true
                                            },
                                            {
                                                "type": "Column",
                                                "width": "stretch",
                                                "items": [
                                                    {
                                                        "type": "Image",
                                                        "altText": "",
                                                        "url": "https://raw.githubusercontent.com/esanchezlMBT/images/master/Mainbit-logo.png",
                                                        "spacing": "Medium",
                                                        "horizontalAlignment": "Center",
                                                        "separator": true
                                                    }
                                                ],
                                                "separator": true
                                            }
                                           
                                            
                                            
                                        ]
                                    },
                                    {
                                        "type": "TextBlock",
                                        "text": "Ticket: "+ details.ticket,
                                        "weight": "Bolder",
                                        "size": "Medium",
                                        "color": "Attention",
                                        "horizontalAlignment": "Right"
                                    },
                                    {
                                        "type": "FactSet",
                                        "facts": [
                                            {
                                                "title": "Proyecto:",
                                                "value": data.data.result[0].sys_domain  + " "
                                            },
                                            {
                                                "title": "Estado:",
                                                "value": data.data.result[0].state + " "
                                            },
                                            {
                                                "title": "Número de Serie:",
                                                "value": data.data.result[0].u_ci + " "
                                            },
                                            {
                                                "title": "Categoría:",
                                                "value": data.data.result[0].category + " "
                                            },
                                            {
                                                "title": "Subcategoría:",
                                                "value": data.data.result[0].subcategory + " "
                                            },
                                            {
                                                "title": "Subcategoría_l2:",
                                                "value": data.data.result[0].u_subcategory_l2 + " "
                                            },
                                            {
                                                "title": "Subcategoría_l3:",
                                                "value": data.data.result[0].u_subcategory_l3 + " "
                                            },
                                            {
                                                "title": "Subcategoría_l4:",
                                                "value": data.data.result[0].u_subcategory_l4 + " "
                                            },
                                            {
                                                "title": "Descripción corta:",
                                                "value": data.data.result[0].short_description + " "
                                            },
                                            {
                                                "title": "Detalles:",
                                                "value": details.description + " "
                                            }
                                        ],
                                        "separator": true,
                                        "spacing": "Medium"
                                    }
                                  ]
                                }
                              }
                            ]
            
                });
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: '**¿Esta información es correcta?**',
                    choices: ChoiceFactory.toChoices(['Sí', 'No'])
                });
                // return data;
          } catch (error) {
            console.log(error);
            await step.context.sendActivity('El número de ticket no se encuentra en la base de datos.');
            return await step.endDialog();
          }
        };   
        return await result();
 
    } 

    if(details.tipo === "Requerimiento") {
        details.tabla = "sc_req_item";
        const result = async function asyncFunc() {
            try {
                const url = config.url + "/table/"+ details.tabla +"?sysparm_query=" + qfoliosn + "STARTSWITH" + details.ticket + "&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=1" ;
                console.log( "URL REQ : ",url);
                const response =  await axios.get(
                    url,
                  {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from(config.sn).toString('base64'))}} ,
          
                );
                const data = await response;
               
                details.sysid = data.data.result[0].sys_id; 
                details.description = data.data.result[0].description; 
                console.log(details.sysid);
                console.log(details.description);
                await step.context.sendActivity({
                    attachments: [
                              {
                                "contentType": "application/vnd.microsoft.card.adaptive",
                                "content": {
                                  "type": "AdaptiveCard",
                                  "version": "1.0",
                                  "body": [
                                    
                                    {
                                        "type": "ColumnSet",
                                        "columns": [
                                            {
                                                "type": "Column",
                                                "width": "stretch",
                                                "items": [
                                                    {
                                                        "type": "Image",
                                                        "altText": "",
                                                        "url": "https://raw.githubusercontent.com/esanchezlMBT/images/master/ServiceNow-logo.png"
                                                    }
                                                ],
                                                "separator": true
                                            },
                                            {
                                                "type": "Column",
                                                "width": "stretch",
                                                "items": [
                                                    {
                                                        "type": "Image",
                                                        "altText": "",
                                                        "url": "https://raw.githubusercontent.com/esanchezlMBT/images/master/Mainbit-logo.png",
                                                        "spacing": "Medium",
                                                        "horizontalAlignment": "Center",
                                                        "separator": true
                                                    }
                                                ],
                                                "separator": true
                                            }
                                           
                                            
                                            
                                        ]
                                    },
                                    {
                                        "type": "TextBlock",
                                        "text": "Ticket: "+ details.ticket,
                                        "weight": "Bolder",
                                        "size": "Medium",
                                        "color": "Attention",
                                        "horizontalAlignment": "Right"
                                    },
                                    {
                                        "type": "FactSet",
                                        "facts": [
                                            {
                                                "title": "Proyecto:",
                                                "value": data.data.result[0].sys_domain  + " "
                                            },
                                            {
                                                "title": "Número de Serie:",
                                                "value": data.data.result[0].u_ci  + " "
                                            },
                                            {
                                                "title": "Estado:",
                                                "value": data.data.result[0].state + " "
                                            },
                                        
                                            {
                                                "title": "Categoría:",
                                                "value": data.data.result[0].u_category  + " "
                                            },
                                            {
                                                "title": "Subcategoría:",
                                                "value": data.data.result[0].u_subcategory  + " "
                                            },
                                            
                                            {
                                                "title": "Descripción corta:",
                                                "value": data.data.result[0].short_description  + " "
                                            },
                                            {
                                                "title": "Detalles:",
                                                "value": details.description  + " "
                                            }
                                        ],
                                        "separator": true,
                                        "spacing": "Medium"
                                    }
                                  ]
                                }
                              }
                            ]
            
                });
                return await step.prompt(CHOICE_PROMPT, {
                    prompt: '**¿Esta información es correcta?**',
                    choices: ChoiceFactory.toChoices(['Sí', 'No'])
                });
                // return data;
          } catch (error) {
            console.log(error);
            
          }
        }; 
        return await result();
    }
    else{
        await step.context.sendActivity('El número de ticket no se encuentra en la base de datos de ServiceNow.');
        return await step.endDialog();
    }
}

async dispatcher(step) {
    console.log('[mainDialog]:dispatcher <<inicia>>');
    const selection = step.result.value;
    switch (selection) {
        
        case 'Sí':
            return await step.prompt(CHOICE_PROMPT, {
                prompt: '**¿Que deseas realizar?**',
                choices: ChoiceFactory.toChoices(['Reportar Incidente', 'Cancelar'])
            });

        case 'No':
            return await step.endDialog();          
          
    }
}

    async choiceDialog(step) {
        console.log('[mainDialog]:choiceDialog <<inicia>>');
        const answer = step.result.value;
        const details = step.options;
        switch (answer) {
            case "Reportar Incidente":
                return await step.beginDialog(ACTUALIZARSN_DIALOG, details);  
            
            case "Cancelar":
                return await step.context.sendActivity('Cancelando...');
        }
       
    }

 

    async finalDialog(step){
        console.log('[mainDialog]: finalDialog');
    return await step.endDialog();
    
    }
}

module.exports.MainDialog = MainDialog;