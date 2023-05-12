INSERT INTO Company(name)
VALUES ('Leizam-Ventures'),
       ('Kach-Ventures');

INSERT
INTO Paybill(number, companyId)
VALUES (303303, 1),
       (733733, 1),
       (545545, 1),
       (801180, 1),
       (909090, 2);

INSERT INTO User (user_id, name, companyId, email, is_admin, password)
VALUES (1, 'Makena', 1, 'lornamakena18@gmail.com', 1, 'girl.nuxt.pass'),
       (2, 'Allan', 1, 'archiethebig@gmail.com', 1, 'dev.nuxt.pass'),
         (3, 'Kelvin', 2, 'kelvin@leizam-ventures.co.ke', 1, '1234');


-- Update password to whatever you want and run the following queries
UPDATE User SET password = '' WHERE user_id = 2;
UPDATE User SET password = '' WHERE user_id = 1;