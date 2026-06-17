const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'C41CF281DC';

const buildToken = (user) =>
    jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '1d' }
    );

const register = async (req, res) => {
    try {
        const { nom, email, mot_de_passe, role } = req.body;

        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({
                message: 'nom, email et mot_de_passe sont obligatoires.'
            });
        }

        if (role && role === 'admin') {
            return res.status(403).json({
                message: 'L\'inscription en tant qu\'administrateur n\'est pas autorisée.'
            });
        }

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(409).json({
                message: 'Un compte avec cet email existe déjà.'
            });
        }

        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        const user = await User.create({
            nom,
            email,
            mot_de_passe: hashedPassword,
            role: 'user'
        });

        const token = buildToken(user);

        return res.status(201).json({
            message: 'Utilisateur créé avec succès.',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            message: 'Erreur serveur lors de l’inscription.'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({
                message: 'email et mot_de_passe sont obligatoires.'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                message: 'Identifiants invalides.'
            });
        }

        const passwordIsValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

        if (!passwordIsValid) {
            return res.status(401).json({
                message: 'Identifiants invalides.'
            });
        }

        const token = buildToken(user);

        return res.status(200).json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Erreur serveur lors de la connexion.'
        });
    }
};

module.exports = {
    register,
    login
};