const {sequelize} = require('./models/db_model');

sequelize.authenticate()
         .then(()=>console.log('connected successfully'))
         .catch((err)=>console.log(err));
         
sequelize.sync({force: true})
         .then(()=>{
             console.log('Schema setup complete.');
             sequelize.query('CREATE OR REPLACE FUNCTION user_verify() RETURNS trigger AS $user_verify$ '
               +'BEGIN '
               +'INSERT INTO verification VALUES(NEW.email,random()*10000,current_timestamp);'
               +'RETURN null;'
               +'END;'
               +'$user_verify$ LANGUAGE plpgsql;'
               +'CREATE TRIGGER verify AFTER INSERT ON users FOR EACH ROW EXECUTE PROCEDURE user_verify();')
               .then(()=>console.log('Trigger verify created'))
               .catch((err)=>console.log(err));
            //  sequelize.query("CREATE OR REPLACE FUNCTION contact_group_checker() RETURNS trigger AS $contact_group_checker$ "
            //    +"DECLARE "
            //    +"x uuid;"
            //    +"BEGIN "
            //    +"IF OLD.contacts IS DISTINCT FROM NEW.contacts THEN "
            //    +"FOREACH x IN ARRAY NEW.contacts "
            //    +"LOOP "
            //    +"IF NOT exists(SELECT 1 FROM users WHERE UID=x LIMIT 1) THEN "
            //    +"RAISE EXCEPTION 'Invalid users in contacts';"
            //    +"END IF;"
            //    +"END LOOP;"
            //    +"END IF;"
            //    +"IF OLD.groups IS DISTINCT FROM NEW.groups THEN "
            //    +"FOREACH x IN ARRAY NEW.groups "
            //    +"LOOP "
            //    +"IF NOT exists(SELECT 1 FROM groups WHERE GID=x LIMIT 1) THEN "
            //    +"RAISE EXCEPTION 'Invalid groupID in groups';"
            //    +"END IF;"
            //    +"END LOOP;"
            //    +"END IF;"
            //    +"RETURN null;"
            //    +"END;"
            //    +"$contact_group_checker$ LANGUAGE plpgsql;"
            //    +"CREATE TRIGGER contact_group_check BEFORE UPDATE ON users FOR EACH ROW "
            //    +"WHEN (OLD.contacts IS DISTINCT FROM NEW.contacts OR OLD.groups IS DISTINCT FROM NEW.groups) "
            //    +"EXECUTE PROCEDURE contact_group_checker();")
            //    .then(()=>console.log('Trigger contact_group_check created'))
            //    .catch((err)=>console.log(err));
            // sequelize.query("CREATE OR REPLACE FUNCTION member_checker() RETURNS trigger AS $member_checker$ "
            //    +"DECLARE "
            //    +"x uuid;"
            //    +"BEGIN "
            //    +"FOREACH x IN ARRAY NEW.members "
            //    +"LOOP "
            //    +"IF NOT exists(SELECT 1 FROM users WHERE UID=x LIMIT 1) OR x IS NOT DISTINCT FROM NEW.admin THEN "
            //    +"RAISE EXCEPTION 'Invalid users in members';"
            //    +"END IF;"
            //    +"END LOOP;"
            //    +"RETURN null;"
            //    +"END;"
            //    +"$member_checker$ LANGUAGE plpgsql;"
            //    +"CREATE TRIGGER member_check BEFORE UPDATE ON groups FOR EACH ROW "
            //    +"WHEN (OLD.members IS DISTINCT FROM NEW.members) "
            //    +"EXECUTE PROCEDURE member_checker();")
            //    .then(()=>console.log('Trigger member_check created'))
            //    .catch((err)=>console.log(err));
            sequelize.query("CREATE OR REPLACE FUNCTION verify_setter() RETURNS trigger AS $verify_setter$ "
               +"BEGIN "
               +"UPDATE users SET verified=TRUE WHERE email=OLD.email;"
               +"RETURN null;"
               +"END;"
               +"$verify_setter$ LANGUAGE plpgsql;"
               +"CREATE TRIGGER verifier AFTER DELETE ON verification FOR EACH ROW EXECUTE PROCEDURE verify_setter();")
               .then(()=>console.log('Trigger verifier created'))
               .catch((err)=>console.log(err));     
         }).catch((err)=>console.log(err));