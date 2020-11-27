import algorithms.create_promoter_terminator
import redis
rds = redis.Redis(host='localhost', port=6379, decode_responses=True)
x = rds.get("ttttt123")
print(x)

# for progress in algorithms.create_promoter_terminator.create_promoter_terminator('5fae5da7b6a7d80830f56259', 500, 200):
#     print(progress)