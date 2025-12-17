-- Teste de comportamento de agregações com valores NULL

CREATE TEMP TABLE t (x INT);

INSERT INTO t VALUES (1), (NULL), (2);

-- COUNT ignora NULL
SELECT COUNT(x) FROM t;

-- COUNT(*) conta todas as linhas
SELECT COUNT(*) FROM t;

-- AVG ignora NULL
SELECT AVG(x) FROM t;

-- Teste com tabela vazia
DELETE FROM t;

SELECT AVG(x) FROM t;