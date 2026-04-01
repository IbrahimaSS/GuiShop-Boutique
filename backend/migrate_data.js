const mongoose = require('mongoose');

// Modifier ces URLs si nécessaire
const LOCAL_URI = 'mongodb://localhost:27017/projetgb';
const ATLAS_URI = 'mongodb+srv://soumahdev_db_user:DZYfl1WXgG9tnCj6@projetgbcluster.jfsggbn.mongodb.net/shop?retryWrites=true&w=majority';

// Liste des collections à migrer (Exactemennt comme vos fichiers modèles)
const collections = [
  'ActivityLog', 'Debt', 'Deposit', 'Expense', 'Invoice', 
  'Product', 'Sale', 'Setting', 'StockRequest', 'User'
];

async function migrate() {
  console.log('🚀 Démarrage de la migration de données (PC -> Atlas)...');

  try {
    // 1. Connexion au local
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connecté à la base locale (PC)');

    // 2. Connexion à l'Atlas (Destination)
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Connecté à Atlas (Cloud)');

    for (const colName of collections) {
      console.log(`📦 Migration de ${colName}...`);
      
      const localModel = localConn.model(colName, new mongoose.Schema({}, { strict: false }));
      const atlasModel = atlasConn.model(colName, new mongoose.Schema({}, { strict: false }));

      // Récupérer tout du local
      const data = await localModel.find({}).lean();
      
      if (data.length > 0) {
        // Vider Atlas par sécurité (optionnel)
        await atlasModel.deleteMany({});
        // Insérer tout dans Atlas
        await atlasModel.insertMany(data);
        console.log(`   ✨ ${data.length} documents migrés avec succès !`);
      } else {
        console.log(`   ℹ️  Aucun document trouvé pour ${colName}.`);
      }
    }

    console.log('\n🏁 MIGRATION TERMINÉE AVEC SUCCÈS ! 🎯🚀✨');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERREUR LORS DE LA MIGRATION :', err);
    process.exit(1);
  }
}

migrate();
