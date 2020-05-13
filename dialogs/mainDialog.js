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

    const result = async function asyncFunc() {
        try {
            const response =  await axios.get(
          
              "https://mainbitprod.service-now.com/api/now/table/incident?sysparm_query=number%3D" + id +'&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_limit=10',
              {headers:{"Accept":"application/json","Content-Type":"application/json","Authorization": ("Basic " + Buffer.from(config.sn).toString('base64'))}} ,
      
            );
            const data = await response;
           
            console.log(data.data.result[0].sys_domain);
            const msg=(` **Ticket:** ${data.data.result[0].number}\n\n **Proyecto:** ${data.data.result[0].sys_domain}\n\n **Número de Serie**: ${data.data.result[0].u_ci} \n\n  **Categoría** ${data.data.result[0].category} \n\n **Subcategoría** ${data.data.result[0].subcategory} \n\n  **Subcategoría_L2** ${data.data.result[0].u_subcategory_l2} \n\n **Subcategoría_L3** ${data.data.result[0].u_subcategory_l3} \n\n**Subcategoría_L4** ${data.data.result[0].u_subcategory_l4} \n\n**Descripción ** ${data.data.result[0].short_description} \n\n**Detalle** ${data.data.result[0].description} \n\n`);
            await step.context.sendActivity(msg);
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

async dispatcher(step) {
    console.log('[mainDialog]:dispatcher <<inicia>>');
    const selection = step.result.value;
    switch (selection) {
        
        case 'Sí':
            return await step.endDialog();

        case 'No':
            return await step.endDialog();          
          
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