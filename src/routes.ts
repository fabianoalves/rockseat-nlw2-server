import express from 'express';
import ClassesController from './controllers/classesController';
import ConnectionsController from './controllers/ConnectionsController';
const routes = express.Router();

//Requests
//Corpo: request.body 
//Route(ex: /users/:id): request.params 
//Query(ex: /users/?page=1): request.query

const classesController = new ClassesController();
const connectionsController = new ConnectionsController();

routes.post('/classes', classesController.create);
routes.get('/classes', classesController.list);

routes.post('/connections', connectionsController.create);
routes.get('/connections', connectionsController.list);

export default routes;


