import {Request, Response} from 'express';
import db from '../database/connecion';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItem{
    week_day: number,
    from: string,
    to: string
}

export default class ClassesController{
    async create(request: Request, response: Response){
        const  {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;
    
        const trx =  await db.transaction();
    
        try { 
            const insertedUsersIds = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio,
            })
    
            const user_id = insertedUsersIds[0];
            console.log('user_id: ', user_id);
            const insertedClassesIds = await trx('classes').insert({
                subject,
                cost,
                user_id
            })
    
            const class_id = insertedClassesIds[0];
            console.log('class_id: ', class_id);
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinutes(scheduleItem.from),
                    to: convertHourToMinutes(scheduleItem.to),
                    class_id
                }
            })
    
            await trx('class_schedule').insert(classSchedule);
    
            await trx.commit();
    
            response.status(201).send()
    
        } catch (error) {
            console.log(error)
            await trx.rollback();
            return response.status(400).json({
                error: 'Unexpected error while creating new class'
            })
        }
    }

    async list(request: Request, response: Response){
        const week_day = request.query.week_day as string;
        const subject = request.query.subject as string;
        const time = request.query.time as string;

        if(!week_day || !subject || !time){
            return response.status(400).json({
                error: 'Missing filters to search classes'
            })
        }

        const timeInMinutes = convertHourToMinutes(time);

        const classes = await db('classes')
            .whereExists(function(){
                this.select('class_schedule.id')
                    .from('class_schedule')
                    .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                    .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                    .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                    .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])

            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id')
            .select(['classes.*', 'users.*']);

        // const classes = await db('classes')
        //     .where('classes.subject', '=', subject)
        //     .join('users', 'classes.user_id', '=', 'users.id')
        //     .select(['classes.*', 'users.*']);

        response.json(classes);
    }
}