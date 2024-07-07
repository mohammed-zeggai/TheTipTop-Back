const mongoose = require("mongoose");

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        email: {
            type: String,
            required: [true, "L'email est obligatoire"],
            validate: {
                validator: (v) => {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
                },
                message: props => `${props.value} n'est pas une adresse email valide !`
            }
        },
        password: {
            type: String,
            minLength: [8, "Le mot de passe doit contenir au moins 8 caractères"],
            required: [true, "Le mot de passe est obligatoire"],
        },
        name: {
            type: String,
            minLength: [2, "Le nom doit contenir au moins 2 caractères"],
            required: [true, "Le nom est obligatoire"]
        },
        access_level: Number,
        is_sso: {
            type: Boolean,
            default: false
        }
    })
);

module.exports = User;
