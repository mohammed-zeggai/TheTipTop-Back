const mongoose = require("mongoose");

const Ticket = mongoose.model(
    "Ticket",
    new mongoose.Schema({
        number: {
            type: String,
            required: [true, "Le numéro de ticket est obligatoire"],
            validate: {
                validator: (v) => {
                    return /^\d{10}$/.test(v);
                },
                message: props => `${props.value} n'est pas un numéro valide !`
            }
        },
        creation_date: {
            type: Date,
            default: new Date()
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gift'
        },
        received: {
            type: Boolean,
            default: false
        },
        reception_date: Date,
        delivered_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    })
);

module.exports = Ticket;
