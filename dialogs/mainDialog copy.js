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
const azurest = require('azure-storage');
const tableSvc = azurest.createTableService(config.storageA, config.accessK);
const azureTS = require('azure-table-storage-async');

// Dialogos
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const {CardFactory} = require('botbuilder');
const { ChoiceFactory, ChoicePrompt, TextPrompt, WaterfallDialog} = require('botbuilder-dialogs');
const moment = require('moment-timezone');

const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

class MainDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'mainDialog');

        // this.addDialog(new FallaDialog());
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.serieStep.bind(this),
            this.infoConfirmStep.bind(this),
            this.dispatcher.bind(this),
            this.choiceDialog.bind(this),
            this.actualizarDialog.bind(this),
            this.finalDialog.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }

async serieStep(step){
    console.log('[mainDialog]:serieStep');

    await step.context.sendActivity('Recuerda que este bot tiene un tiempo limite de 10 minutos.');

    return await step.prompt(TEXT_PROMPT, `Por favor, **escribe el Número de Ticket de ServiceNow que deseas consultar.**`);
}

async infoConfirmStep(step) {
    console.log('[mainDialog]:infoConfirmStep <<inicia>>');
    const details = step.options;
    console.log(details);
    details.result = step.result;

    const id = details.result.toUpperCase();
    const trim = id.replace(/ /g,'');
    details.tt = trim;
console.log(trim);
    if (trim.startsWith("INC")) {
        const result = async function asyncFunc() {
            try {
                const response =  await axios.get(
              
                  config.url + "/table/incident?sysparm_query=number%3D" + trim +'&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=10',
                  {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from(config.sn).toString('base64'))}} ,
          
                );
                const data = await response;
               
                // console.log(data.data.result[0]);
                details.sysid = data.data.result[0].sys_id; 
                details.description = data.data.result[0].description; 
                console.log(details.sysid);
                console.log(details.description);
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
                                        "text": "Ticket: "+ data.data.result[0].number,
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
    if(trim.startsWith("RITM")) {
        const result = async function asyncFunc() {
            try {
                const response =  await axios.get(
              
                  config.url + "/table/sc_req_item?sysparm_query=number%3D" + trim +'&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=10',
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
                                        "text": "Ticket: "+ data.data.result[0].number,
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
                choices: ChoiceFactory.toChoices(['Actualizar Descripción', 'Cancelar'])
            });

        case 'No':
            return await step.endDialog();          
          
    }
}

    async choiceDialog(step) {
        console.log('[mainDialog]:choiceDialog <<inicia>>');
        const answer = step.result.value;
        switch (answer) {
            case "Actualizar Descripción":
                
                return await step.prompt(TEXT_PROMPT, `Por favor, **escribe la descripción.**`);
            
            case "Cancelar":

                return await step.context.sendActivity('Cancelando...');
        }
       
    }

    async actualizarDialog(step){
        console.log('[mainDialog]:actualizarDialog <<inicia>>');
        const descripcion = step.result;
        const details = step.options;

        moment.locale('es');
        const cdmx = moment().tz("America/Mexico_City");
        console.log(cdmx.format('LLL'));
        console.log(details.sysid);
        console.log(details);
        console.log(details.description);
        
        const result = async function asyncFunc() {
            try {
                const response =  await axios.put(
              
                    config.url + "/table/incident/" + details.sysid,
                    {"description": cdmx.format('LLL') + " " + descripcion + "\n" + details.description},
                    {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from(config.sn).toString('base64'))}}
            
                  );
                  await response;
                  console.log('await response');
                  await step.prompt(TEXT_PROMPT, `La información ha sido actualizada correctamente.`);
                  return await step.endDialog();
                  
            } catch (error) {
                console.log(error);
            await step.context.sendActivity('La operación no se pudo realizar en estos momentos, intentalo más tarde.');
            return await step.endDialog();
            }
        };
        await result();
        return await step.endDialog();

    }

    async finalDialog(step){
        console.log('[mainDialog]: finalDialog');
    return await step.endDialog();
    
    }
}

module.exports.MainDialog = MainDialog;