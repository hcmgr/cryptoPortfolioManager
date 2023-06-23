p = 26
n = p

for i in range(2, n):
    for j in range(2, n):
        if i != j and ((3*i) % p) == ((3*j) % p):
            print(i, j)


