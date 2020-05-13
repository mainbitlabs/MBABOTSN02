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
// const config = require('../config');
const axios = require ('axios');

// Dialogos
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { ChoiceFactory, ChoicePrompt, TextPrompt, WaterfallDialog} = require('botbuilder-dialogs');

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
    step.values.tt = step.result;

    const id = step.values.tt;

const result = async()=> {
    try {
        return await axios.get(
    
            "https://mainbitprod.service-now.com/api/now/table/incident?sysparm_query=number%3D" + id +'&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=10',
            {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from("mjimenez@mainbit.com.mx:Mainbit.1").toString('base64'))}} ,
        
          )
    } catch (error) {
        console.log(error);
        
    }
}
    //  console.log(response.data.result);
    // console.log("Ticket: ",response.data.result[0].number);
    //  console.log("Estado: ",response.data.result[0].state);
    //  console.log("No de serie: ",response.data.result[0].u_ci);
    //  console.log("Proyecto: ",response.data.result[0].sys_domain);
    //  console.log("Categoria: ",response.data.result[0].category);
    //  console.log("Subcategoria: ",response.data.result[0].subcategory);
    //  console.log("Subcategoria 2: ",response.data.result[0].u_subcategory_l2);
    //  console.log("Subcategoria 3: ",response.data.result[0].u_subcategory_l3);
    //  console.log("Subcategoria 4: ",response.data.result[0].u_subcategory_l4);
    //  console.log("Abierto en: ",response.data.result[0].opened_at);
    //  console.log("Grupo Asignado: ",response.data.result[0].assignment_group);
    //  console.log("Descripción corta: ",response.data.result[0].short_description);
    //  console.log("Descripción: ",response.data.result[0].description);
if (result){
    console.log(result);
    /*
    const msg=(` **Ticket:** ${response.data.result[0].number}\n\n **Proyecto:** ${response.data.result[0].sys_domain}\n\n **Número de Serie**: ${response.data.result[0].u_ci} \n\n  **Categoría** ${response.data.result[0].category} \n\n **Subcategoría** ${response.data.result[0].subcategory} \n\n  `);
    await step.context.sendActivity(msg);*/
}
  
}

async dispatcher(step) {
    console.log('[mainDialog]:dispatcher <<inicia>>');
    const selection = step.result.value;
    switch (selection) {
        
        case 'Sí':
            return await step.prompt(CHOICE_PROMPT,{
                prompt:'¿Tu solicitud es un requerimiento, una falla o servicio general?',
                choices: ChoiceFactory.toChoices(['Falla', 'Servicio'])
            });

        case 'No':
           return await step.beginDialog(MAILER_DIALOG);             
          
    }
}

    async choiceDialog(step) {
        console.log('[mainDialog]:choiceDialog <<inicia>>');
        // console.log('result ?',step.result);

        if (step.result === undefined) {
            return await step.endDialog();
        } else {
            const answer = step.result.value;
            config.solicitud = {};
            const sol = config.solicitud;
            if (!step.result) {
            }
            if (!answer) {
                // exhausted attempts and no selection, start over
                await step.context.sendActivity('Not a valid option. We\'ll restart the dialog ' +
                    'so you can try again!');
                return await step.endDialog();
            }
            if (answer ==='Falla') {
                sol.level1 = answer;
                return await step.beginDialog(FALLA_DIALOG); 
            } 
            if (answer ==='Servicio') {
                sol.level1 = answer;
                return await step.beginDialog(SERVICIO_DIALOG); 
            } 
    }
        console.log('[mainDialog]:choiceDialog<<termina>>');
        return await step.endDialog();
    }

    async finalDialog(step){
        console.log('[mainDialog]: finalDialog');
    return await step.endDialog();
    
    }
}

module.exports.MainDialog = MainDialog;
