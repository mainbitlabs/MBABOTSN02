/*

                 _               _ _               _____ _   _ 
       /\       | |             | (_)             / ____| \ | |
      /  \   ___| |_ _   _  __ _| |_ ______ _ _ _| (___ |  \| |
     / /\ \ / __| __| | | |/ _` | | |_  / _` | '__\___ \| . ` |
    / ____ \ (__| |_| |_| | (_| | | |/ / (_| | |  ____) | |\  |
   /_/    \_\___|\__|\__,_|\__,_|_|_/___\__,_|_| |_____/|_| \_|
                                             ______            
                                            |______|           
*/          

const config = require('../config');
const axios = require ('axios');


const { ComponentDialog, WaterfallDialog, ChoicePrompt, ChoiceFactory, TextPrompt } = require('botbuilder-dialogs');
const moment = require('moment-timezone');

const ACTUALIZARSN_DIALOG = "ACTUALIZARSN_DIALOG";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';

class ActualizarSNDialog extends ComponentDialog {
    constructor(){
        super(ACTUALIZARSN_DIALOG);
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.choiceDialog.bind(this),
            this.selectDialog.bind(this),
            this.actualizarDialog.bind(this)

        ]));
        this.initialDialogId = WATERFALL_DIALOG;

    }
    async choiceDialog(step){
        console.log('[ActualizarSN]: choiceDialog <<inicia>>');

        const details = step.options;

return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Por favor, **indica el tipo de Incidente.**',
            choices: ChoiceFactory.toChoices(['Usuario no localizado', 'Usuario no disponible' , 'Inmueble cerrado por pandemia', 'Eventualidad'])
        });
    }
    async selectDialog(step){
        console.log('[ActualizarSN]: selectDialog <<inicia>>');

        const details = step.options;
        details.incidente = step.result.value;

        switch (details.incidente) {
            case 'Usuario no localizado':
                return await step.prompt(CHOICE_PROMPT,{
                    prompt: 'Elige el motivo',
                    choices: ChoiceFactory.toChoices(['Por horario de inmueble', 'Fin joranda laboral del usuario', 'No se pudo contactar al usuario vía telefónica', 'No acudio a la cita programada'])
                });
            case 'Usuario no disponible' :
                return await step.prompt(CHOICE_PROMPT,{
                    prompt: 'Elige el motivo',
                    choices: ChoiceFactory.toChoices(['Pospone atención, acuerda próxima cita', 'Jornada próxima a vencer', 'Tiempo de atención mayor a la jornada laboral del usuario'])
                });
            case 'Inmueble cerrado por pandemia' :
                return await step.prompt(CHOICE_PROMPT,{
                    prompt: 'Elige el motivo',
                    choices: ChoiceFactory.toChoices(['Atención solo por cita en inmueble'])
                });
            case 'Eventualidad' :
                return await step.prompt(CHOICE_PROMPT,{
                    prompt: 'Elige el motivo',
                    choices: ChoiceFactory.toChoices(['Accidente', 'Cierre de vías de comunicación', 'Clima', 'Inseguridad'])
                });
            default:
                break;
        }
    }

    async actualizarDialog(step){
        console.log('[ActualizarSN]:actualizarDialog <<inicia>>');
        const motivos = step.result.value;
        const details = step.options;
            details.motivos = motivos;

        moment.locale('es');
        const cdmx = moment().tz("America/Mexico_City");
        console.log(cdmx.format('LLL'));
        console.log(details.sysid);
        console.log(details);
        console.log(details.description);
        
        const result = async function asyncFunc() {
            try {
                const url = config.url + "/table/" + details.tabla + "/" + details.sysid ;
                console.log("URL_Put : ", url);
                const response =  await axios.put(
                    url,
                    {"description": cdmx.format('LLL') + " Descripción: " + details.incidente + " / " + details.motivos + "\n" + details.description},
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
}
module.exports.ActualizarSNDialog = ActualizarSNDialog;
module.exports.ACTUALIZARSN_DIALOG = ACTUALIZARSN_DIALOG;