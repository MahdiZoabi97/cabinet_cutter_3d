CC=gcc
CFLAGS=-Wall

all: cabinet

cabinet: main.o panels.o optimizer.o
	$(CC) $(CFLAGS) -o cabinet main.o panels.o optimizer.o

clean:
	rm -f *.o cabinet
