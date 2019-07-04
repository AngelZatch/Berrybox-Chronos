import * as express from "express";
import * as bodyParser from 'body-parser';
import * as supertest from "supertest";
import * as chai from "chai";
const expect = chai.expect;

import BoxApi from './../../../src/api/routes/box.api';
const Box = require('./../../../src/models/box.schema');
const User = require('./../../../src/models/user.model');

describe("Box API", () => {

    const expressApp = express();

    before(async () => {
        expressApp.use(bodyParser.json({ limit: '15mb', type: 'application/json' }));
        expressApp.use('/', BoxApi);

        await User.findByIdAndDelete('9ca0df5f86abeb66da97ba5d');

        await Box.deleteMany(
            {
                _id: {
                    $in: ['9cb763b6e72611381ef043e4', '9cb763b6e72611381ef043e5',
                        '9cb763b6e72611381ef043e6', '9cb763b6e72611381ef043e7']
                }
            }
        );

        await User.create({
            _id: '9ca0df5f86abeb66da97ba5d',
            name: 'Ash Ketchum',
            mail: 'ash@pokemon.com',
            password: 'Pikachu'
        });

        await Box.create({
            _id: '9cb763b6e72611381ef043e4',
            description: null,
            lang: 'English',
            name: 'Test box',
            playlist: [],
            creator: '9ca0df5f86abeb66da97ba5d',
            open: true
        });

        await Box.create({
            _id: '9cb763b6e72611381ef043e5',
            description: 'Closed box',
            lang: 'English',
            name: 'Closed box',
            playlist: [],
            creator: '9ca0df5f86abeb66da97ba5d',
            open: false
        });

        await Box.create({
            _id: '9cb763b6e72611381ef043e6',
            description: 'Open box to delete',
            lang: 'English',
            name: 'Open box to delete',
            playlist: [],
            creator: '9ca0df5f86abeb66da97ba5d',
            open: true
        });

        await Box.create({
            _id: '9cb763b6e72611381ef043e7',
            description: 'Closed box to delete',
            lang: 'English',
            name: 'Closed box to delete',
            playlist: [],
            creator: '9ca0df5f86abeb66da97ba5d',
            open: false
        });
    });

    after(async () => {
        await User.findByIdAndDelete('9ca0df5f86abeb66da97ba5d');

        await Box.deleteMany(
            {
                _id: {
                    $in: ['9cb763b6e72611381ef043e4', '9cb763b6e72611381ef043e5',
                        '9cb763b6e72611381ef043e6', '9cb763b6e72611381ef043e7']
                }
            }
        );
    });

    it("Gets all boxes", () => {
        return supertest(expressApp)
            .get('/')
            .expect(200)
            .then((response) => {
                const boxes = response.body;

                expect(boxes.length).to.be.greaterThan(0);
            });
    });

    describe("Gets a single box", () => {
        it("Sends a 404 back if no box matches the id given", () => {
            return supertest(expressApp)
                .get('/9cb763b6e72611381ef044e4')
                .expect(404, 'BOX_NOT_FOUND');
        });

        it("Sends a 200 with the proper box if the id matches", () => {
            return supertest(expressApp)
                .get('/9cb763b6e72611381ef043e4')
                .expect(200)
                .then((response) => {
                    const box = response.body;

                    expect(box._id).to.equal('9cb763b6e72611381ef043e4');
                    expect(box.creator).to.eql({
                        _id: '9ca0df5f86abeb66da97ba5d',
                        name: 'Ash Ketchum'
                    });
                });
        });
    });

    describe("Updates a box", () => {
        it("Sends a 412 back if no request body is given", () => {
            return supertest(expressApp)
                .put('/9cb763b6e72611381ef043e4')
                .expect(412, 'MISSING_PARAMETERS');
        });

        it("Sends a 412 back if the request parameter and the _id given in the request body mismatch", () => {
            const updateBody = {
                _id: '9cb763b6e72611381ef044e4',
                description: 'Test box edited',
                lang: 'English',
                name: 'Test box',
                playlist: [],
                creator: {
                    _id: '9ca0df5f86abeb66da97ba5d',
                    name: 'Ash Ketchum'
                }
            };

            return supertest(expressApp)
                .put('/9cb763b6e72611381ef043e4')
                .send(updateBody)
                .expect(412, 'IDENTIFIER_MISMATCH');
        });

        it("Sends a 404 back if no box matches the id given", () => {
            const updateBody = {
                _id: '9cb763b6e72611381ef044e4',
                description: 'Test box edited',
                lang: 'English',
                name: 'Test box',
                playlist: [],
                creator: {
                    _id: '9ca0df5f86abeb66da97ba5d',
                    name: 'Ash Ketchum'
                }
            };

            return supertest(expressApp)
                .put('/9cb763b6e72611381ef044e4')
                .send(updateBody)
                .expect(404, 'BOX_NOT_FOUND');
        });

        it("Sends a 200 back with the updated box", () => {
            const updateBody = {
                _id: '9cb763b6e72611381ef043e4',
                description: 'Test box edited',
                lang: 'English',
                name: 'Test box',
                playlist: [],
                creator: {
                    _id: '9ca0df5f86abeb66da97ba5d',
                    name: 'Ash Ketchum'
                }
            };

            return supertest(expressApp)
                .put('/9cb763b6e72611381ef043e4')
                .send(updateBody)
                .expect(200)
                .then((response) => {
                    const updatedBox = response.body;

                    expect(updatedBox.description).to.equal('Test box edited');
                });
        });
    });

    describe("Deletes a box", () => {
        it("Sends a 404 back if no box matches the id given", () => {
            return supertest(expressApp)
                .delete('/9cb763b6e72611381ef044e4')
                .expect(404, 'BOX_NOT_FOUND');
        });

        // it("Sends a 403 Forbidden error if the user attempting to close the box is not the author", () => {
        //     return supertest(expressApp)
        //         .delete('/9cb763b6e72611381ef044e4')
        //         .expect(403, 'FORBIDDEN');
        // });

        it("Sends a 412 BOX_IS_OPEN Error if the box is still open when attempting to close it", () => {
            return supertest(expressApp)
                .delete('/9cb763b6e72611381ef043e6')
                .expect(412, 'BOX_IS_OPEN');
        });

        it("Sends a 200 with the closed box", () => {
            return supertest(expressApp)
                .delete('/9cb763b6e72611381ef043e7')
                .expect(200)
                .then((response) => {
                    const deletedBox = response.body;

                    expect(deletedBox._id).to.equal('9cb763b6e72611381ef043e7');
                    expect(deletedBox.open).to.be.false;
                })
        });
    });

    describe("Closes a box", () => {
        it("Sends a 404 back if no box matches the id given", () => {
            return supertest(expressApp)
                .post('/9cb763b6e72611381ef044e4/close')
                .expect(404, 'BOX_NOT_FOUND');
        });

        it("Sends a 200 with the closed box", () => {
            return supertest(expressApp)
                .post('/9cb763b6e72611381ef043e4/close')
                .expect(200)
                .then((response) => {
                    const closedBox = response.body;

                    expect(closedBox._id).to.equal('9cb763b6e72611381ef043e4');
                    expect(closedBox.open).to.be.false;
                })
        });
    });

    describe("Opens a box", () => {
        it("Sends a 404 back if no box matches the id given", () => {
            return supertest(expressApp)
                .post('/9cb763b6e72611381ef044e4/open')
                .expect(404, 'BOX_NOT_FOUND');
        });

        it('Sends a 200 with the opened box', () => {
            return supertest(expressApp)
                .post('/9cb763b6e72611381ef043e4/open')
                .expect(200)
                .then((response) => {
                    const openedBox = response.body;

                    expect(openedBox._id).to.equal('9cb763b6e72611381ef043e4');
                    expect(openedBox.open).to.be.true;
                })
        });
    });
});